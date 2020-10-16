import { useEffect, useState } from "react";
import { MiddlewareType, setPromiseMiddleware } from "./promise-middleware";

export type API_REQUEST_STATUS = "WAIT" | "PENDING" | "SUCCESS" | "FAIL";

type TNullValue = undefined;
export const nullValue = undefined;

type TRequest<T> = Promise<T>;

export interface TUseApiRequestProps<T = any> {
  alertService?: IAlertService;
  getErrorMessageCallback?: (error: any) => string;
  fetchOnMountData?: any;
  request: (...args: any) => TRequest<T>;
  defaultData?: T;
  catchCallback?: (error: any) => void;
  successMessage?: string;
  middleware?: MiddlewareType[];
  fetchOnMount?: boolean;
}

export interface TUseApiRequestOutput<T> {
  setData: (data: T | TNullValue) => void;
  status: API_REQUEST_STATUS;
  errorMessage: string;
  isPending: boolean;
  data: T | TNullValue;
  sendRequest: (props?: any) => TRequest<any>;
  cleanErrorMessage: () => void;
}

export interface IAlert {
  content: string;
  title?: string;
  image?: string;
  color?: string;
}

export interface IAlertService {
  successAlert: (alert: IAlert) => void;
  warningAlert: (alert: IAlert) => void;
  errorAlert: (alert: IAlert) => void;
}

const defaultGetErrorMessageCallback = (errorMessage: string) => errorMessage;

export const useApiRequest = <T extends any>({
  alertService,
  getErrorMessageCallback = defaultGetErrorMessageCallback,
  fetchOnMountData,
  fetchOnMount,
  middleware = [],
  successMessage,
  request,
  defaultData,
  catchCallback
}: TUseApiRequestProps<T>): TUseApiRequestOutput<T> => {
  const [status, setStatus] = useState<API_REQUEST_STATUS>("WAIT");
  const [data, setData] = useState<T | TNullValue>(defaultData || nullValue);
  const [errorMessage, setErrorMessageState] = useState<string>("");
  const setErrorMessage = (error: any) =>
    setErrorMessageState(getErrorMessageCallback(error));
  const cleanErrorMessage = () => setErrorMessageState("");

  const [isPending, setIsPending] = useState<boolean>(false);

  const sendSuccessMessage = (res: any) => {
    if (successMessage && alertService)
      alertService.successAlert({ content: successMessage });
    setStatus("SUCCESS");
    return res;
  };

  const middlewareList: MiddlewareType[] = [
    ...middleware,
    setData,
    cleanErrorMessage,
    sendSuccessMessage
  ];

  const sendRequest = (props?: any) => {
    setIsPending(true);
    setStatus("PENDING");
    return ((setPromiseMiddleware(
      request(props),
      middlewareList
    ) as unknown) as Promise<any>)
      .catch((error: any) => {
        const errorMessage = getErrorMessageCallback(error);
        setStatus("FAIL");
        setErrorMessage(errorMessage);
        if (alertService) alertService.errorAlert({ content: errorMessage });
        catchCallback && catchCallback(error);
      })
      .finally(() => {
        setIsPending(false);
      }) as TRequest<T>;
  };

  useEffect(() => {
    if (fetchOnMount) sendRequest(fetchOnMountData);
  }, []);

  return {
    setData,
    status,
    errorMessage,
    cleanErrorMessage,
    isPending,
    data,
    sendRequest
  };
};
