import { useEffect, useState } from 'react'
import { View, ScrollView, Alert, Image, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Button } from '../../../components/ui/Button'
import { SessionService } from '../../../services/session.service'
import { PDFExportService } from '../../../services/pdf-export.service'
import { Session } from '../../../types/models'
import { dateUtils } from '../../../utils/timezone'

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadSession()
  }, [id])

  const loadSession = async () => {
    if (!id) return

    setLoading(true)
    try {
      const data = await SessionService.getSessionById(id)
      setSession(data)
    } catch (error) {
      Alert.alert('Error', 'Failed to load session')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!session) return

    setExporting(true)
    try {
      await PDFExportService.exportSession(session)
      Alert.alert('Success', 'Report exported successfully!')
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export: ' + error.message)
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await SessionService.deleteSession(id!)
              Alert.alert('Success', 'Session deleted')
              router.back()
            } catch (error) {
              Alert.alert('Error', 'Failed to delete session')
            }
          },
        },
      ]
    )
  }

  if (loading || !session) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView className="flex-1 px-6 py-8">
        <ThemedText weight="bold" className="text-3xl mb-2">
          Session Details
        </ThemedText>
        <ThemedText variant="secondary" className="text-base mb-8">
          {dateUtils.formatPH(session.date, 'EEEE, MMMM dd, yyyy')}
        </ThemedText>

        {/* Time Info */}
        <ThemedCard className="mb-4">
          <ThemedText variant="secondary" className="text-sm mb-4">
            ⏰ Time Information
          </ThemedText>
          
          <View className="flex-row justify-between mb-3">
            <ThemedText variant="secondary">Time In:</ThemedText>
            <ThemedText weight="medium">
              {dateUtils.formatPH(session.time_in, 'hh:mm:ss a')}
            </ThemedText>
          </View>

          <View className="flex-row justify-between mb-3">
            <ThemedText variant="secondary">Time Out:</ThemedText>
            <ThemedText weight="medium">
              {session.time_out
                ? dateUtils.formatPH(session.time_out, 'hh:mm:ss a')
                : 'Not ended'}
            </ThemedText>
          </View>

          <View className="flex-row justify-between">
            <ThemedText variant="secondary">Total Hours:</ThemedText>
            <ThemedText weight="bold" className="text-xl">
              {session.total_hours.toFixed(2)}h
            </ThemedText>
          </View>
        </ThemedCard>

        {/* Breaks */}
        {session.breaks.length > 0 && (
          <ThemedCard className="mb-4">
            <ThemedText variant="secondary" className="text-sm mb-4">
              ☕ Breaks ({session.breaks.length})
            </ThemedText>
            
            {session.breaks.map((br, index) => (
              <View
                key={index}
                className="flex-row justify-between mb-2 pb-2 border-b border-dark-tertiary last:border-0"
              >
                <ThemedText variant="secondary">Break {index + 1}:</ThemedText>
                <ThemedText>
                  {dateUtils.formatPH(br.start, 'hh:mm a')} -{' '}
                  {br.end ? dateUtils.formatPH(br.end, 'hh:mm a') : 'Ongoing'}
                </ThemedText>
              </View>
            ))}
          </ThemedCard>
        )}

        {/* Tasks */}
        {session.tasks && (
          <ThemedCard className="mb-4">
            <ThemedText variant="secondary" className="text-sm mb-2">
              📝 Tasks Completed
            </ThemedText>
            <ThemedText className="text-base">{session.tasks}</ThemedText>
          </ThemedCard>
        )}

        {/* Lessons Learned */}
        {session.lessons_learned && (
          <ThemedCard className="mb-4">
            <ThemedText variant="secondary" className="text-sm mb-2">
              💡 Lessons Learned
            </ThemedText>
            <ThemedText className="text-base">{session.lessons_learned}</ThemedText>
          </ThemedCard>
        )}

        {/* Notes */}
        {session.notes && (
          <ThemedCard className="mb-4">
            <ThemedText variant="secondary" className="text-sm mb-2">
              📌 Notes
            </ThemedText>
            <ThemedText className="text-base">{session.notes}</ThemedText>
          </ThemedCard>
        )}

        {/* Images */}
        {session.image_urls && session.image_urls.length > 0 && (
          <ThemedCard className="mb-4">
            <ThemedText variant="secondary" className="text-sm mb-4">
              📷 Images ({session.image_urls.length})
            </ThemedText>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {session.image_urls.map((url, index) => (
                  <TouchableOpacity key={index}>
                    <Image
                      source={{ uri: url }}
                      className="w-40 h-40 rounded-lg"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </ThemedCard>
        )}

        {/* Actions */}
        <View className="space-y-3 mt-8 mb-8">
          <Button 
            onPress={handleExport}
            loading={exporting}
            disabled={exporting}
          >
            📄 Export as PDF
          </Button>
          
          <Button variant="outline" onPress={() => router.back()}>
            Back to History
          </Button>
          
          <Button variant="danger" onPress={handleDelete}>
            Delete Session
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  )
}