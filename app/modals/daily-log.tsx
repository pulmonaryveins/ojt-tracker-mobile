import { useState } from 'react'
import { View, ScrollView, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { ThemedView } from '../../components/themed/ThemedView'
import { ThemedText } from '../../components/themed/ThemedText'
import { ThemedCard } from '../../components/themed/ThemedCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useSessionStore } from '../../stores/session.store'
import { useAuthStore } from '../../stores/auth.store'
import { supabase } from '../../lib/supabase'
import { dailyLogSchema } from '../../utils/validation'

export default function DailyLogModal() {
  const router = useRouter()
  const { activeSession, endSession } = useSessionStore()
  const user = useAuthStore((state) => state.user)
  
  const [tasks, setTasks] = useState('')
  const [lessonsLearned, setLessonsLearned] = useState('')
  const [notes, setNotes] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{
    visible: boolean
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    actions?: Array<{
      text: string
      onPress: () => void
      variant?: 'primary' | 'outline' | 'ghost'
    }>
  }>({ visible: false, title: '', message: '', type: 'info' })

  const pickImage = async () => {
    if (images.length >= 3) {
      setModal({
        visible: true,
        title: 'Limit Reached',
        message: 'You can only upload up to 3 images',
        type: 'warning'
      })
      return
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      setModal({
        visible: true,
        title: 'Permission Needed',
        message: 'Please grant photo library access',
        type: 'warning'
      })
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 3 - images.length,
      quality: 0.8,
    })

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri)
      setImages([...images, ...newImages])
    }
  }

  const takePhoto = async () => {
    if (images.length >= 3) {
      setModal({
        visible: true,
        title: 'Limit Reached',
        message: 'You can only upload up to 3 images',
        type: 'warning'
      })
      return
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    
    if (status !== 'granted') {
      setModal({
        visible: true,
        title: 'Permission Needed',
        message: 'Please grant camera access',
        type: 'warning'
      })
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    })

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (const imageUri of images) {
      try {
        const response = await fetch(imageUri)
        const blob = await response.blob()
        const fileExt = imageUri.split('.').pop()
        const fileName = `${activeSession!.id}-${Date.now()}-${Math.random()}.${fileExt}`
        const filePath = `${user!.id}/logs/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('log-images')
          .upload(filePath, blob)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('log-images')
          .getPublicUrl(filePath)

        uploadedUrls.push(data.publicUrl)
      } catch (error) {
        console.error('Error uploading image:', error)
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async () => {
    try {
      dailyLogSchema.parse({ tasks, lessonsLearned, notes })
    } catch (error: any) {
      setModal({
        visible: true,
        title: 'Validation Error',
        message: error.errors[0].message,
        type: 'error'
      })
      return
    }

    setLoading(true)
    try {
      // Upload images first
      const imageUrls = images.length > 0 ? await uploadImages() : []

      // End session with log data
      await endSession(activeSession!.id, {
        tasks,
        lessonsLearned: lessonsLearned || undefined,
        notes: notes || undefined,
      })

      // Update session with image URLs if any
      if (imageUrls.length > 0) {
        await supabase
          .from('sessions')
          .update({ image_urls: imageUrls })
          .eq('id', activeSession!.id)
      }
      
      setModal({
        visible: true,
        title: 'Success',
        message: 'Session ended and log saved!',
        type: 'success',
        actions: [{
          text: 'OK',
          onPress: () => {
            setModal(prev => ({ ...prev, visible: false }))
            router.back()
          },
          variant: 'primary'
        }]
      })
    } catch (error: any) {
      setModal({
        visible: true,
        title: 'Error',
        message: error.message,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView className="flex-1 px-6 py-8">
        <ThemedText weight="bold" className="text-2xl mb-2">
          Daily Log 📝
        </ThemedText>
        <ThemedText variant="secondary" className="text-sm mb-8">
          Document what you did today
        </ThemedText>

        <Input
          label="Tasks Completed *"
          value={tasks}
          onChangeText={setTasks}
          placeholder="What did you work on today?"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Input
          label="Lessons Learned"
          value={lessonsLearned}
          onChangeText={setLessonsLearned}
          placeholder="What did you learn?"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes?"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Image Upload Section */}
        <View className="mb-6">
          <ThemedText variant="secondary" className="text-sm mb-2">
            Images (Optional) - Max 3
          </ThemedText>
          
          {images.length > 0 && (
            <ScrollView horizontal className="mb-4">
              <View className="flex-row gap-2">
                {images.map((uri, index) => (
                  <View key={index} className="relative">
                    <Image
                      source={{ uri }}
                      className="w-24 h-24 rounded-lg"
                    />
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
                    >
                      <ThemedText className="text-white text-xs">✕</ThemedText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {images.length < 3 && (
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onPress={pickImage}
              >
                📷 Gallery
              </Button>
              
              <Button
                variant="outline"
                className="flex-1"
                onPress={takePhoto}
              >
                📸 Camera
              </Button>
            </View>
          )}
        </View>

        <View className="flex-row gap-4 mt-8">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => router.back()}
          >
            Cancel
          </Button>
          
          <Button
            className="flex-1"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !tasks}
          >
            {images.length > 0 ? `Save & Upload (${images.length})` : 'Save & End'}
          </Button>
        </View>
      </ScrollView>

      {/* Custom Modal */}
      <Modal
        visible={modal.visible}
        title={modal.title}
        type={modal.type}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
        actions={modal.actions}
      >
        <ThemedText style={{ fontSize: 16, lineHeight: 24 }}>
          {modal.message}
        </ThemedText>
      </Modal>
    </ThemedView>
  )
}