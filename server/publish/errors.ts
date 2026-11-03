/* Errors every platform publisher throws. PublishError is retried unless it is permanent;
   NeedsAction moves the post to needs_action with a task (the user finishes it by hand). */
export class PublishError extends Error {
  retryable: boolean;
  needsReconnect: boolean;
  constructor(message: string, retryable: boolean, needsReconnect = false) {
    super(message);
    this.retryable = retryable;
    this.needsReconnect = needsReconnect;
  }
}

export class NeedsAction extends Error {
  constructor(message: string) {
    super(message);
  }
}
