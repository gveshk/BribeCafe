export type UseCaseResult<T> = {
  success: boolean;
  errorCode?: string;
  message: string;
  data?: T;
};
