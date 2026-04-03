export type ApiSuccessResponse<T> = {
  status: 'success';
  message: string;
  code: string;
  data: T;
};

export type ApiAckResponse = {
  status: 'success';
  message: string;
  code: string;
};

export function apiSuccess<T>(data: T, message: string, code: string): ApiSuccessResponse<T> {
  return {
    status: 'success',
    message,
    code,
    data,
  };
}

export function apiAck(message: string, code: string): ApiAckResponse {
  return {
    status: 'success',
    message,
    code,
  };
}

