export type BannerState =
  | {
      type: "info" | "success" | "error";
      title: string;
      message: string;
      debug?: any;
    }
  | null;

export type ApiErrorItem = {
  error_code?: string;
  error_message?: string;
};

export type KycNote = {
  note_Type?: string;
  comments?: string;
  date_Posted?: string;
};

export type StatusApi = {
  kyc_Status?: string;
  process_result?: boolean;
  note_List?: KycNote[];
  total_data_no?: number;
  error_list?: ApiErrorItem[];
};

export type DetailApi = {
  kyc_status?: string;
  process_result?: boolean;
  error_list?: ApiErrorItem[];
  kyc_detail?: any;
};

export type UploadItem = {
  file: File;
  previewUrl: string;
};