export type ApiSuccess<T> = {
  status: 'success';
  message: string;
  code: string;
  data: T;
};

export type ApiError = {
  status: 'error';
  message: string;
  code: string;
};

export type ApiAck = {
  status: 'success';
  message: string;
  code: string;
};

