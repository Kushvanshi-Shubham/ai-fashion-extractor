export interface CompressMessage {
  type: 'COMPRESS';
  payload: File;
}

export interface CompressResult {
  success: boolean;
  data?: string;
  error?: string;
}
