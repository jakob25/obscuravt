/** Category used for VTuber profile stream predictions (reuses bets infrastructure). */
export const STREAM_PREDICTION_CATEGORY = 'Stream Prediction'

export interface StreamPredictionOption {
  id: string
  label: string
  totalScraps: number
}

export interface StreamPrediction {
  id: string
  title: string
  description: string
  vtuberName: string
  options: StreamPredictionOption[]
  status: 'open' | 'voting' | 'closed'
  createdAt: string
  result: string | null
}