// src/utils.ts
import { Result, AsyncResult } from './types';

// === Result Helpers ===
export const success = <T, E = Error>(data: T): Result<T, E> => ({ success: true, data });
export const failure = <E>(error: E): Result<never, E> => ({ success: false, error });

export const asyncSuccess = async <T, E = Error>(data: T): AsyncResult<T, E> => success<T, E>(data);
export const asyncFailure = async <E>(error: E): AsyncResult<never, E> => failure(error);

// === Result Combinators ===
export const mapResult = <T, U, E = Error>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> =>
  result.success ? success<U, E>(fn(result.data)) : result;

export const flatMapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> =>
  result.success ? fn(result.data) : result;

export const mapAsyncResult = async <T, U, E = Error>(
  result: AsyncResult<T, E>,
  fn: (data: T) => Promise<U>
): AsyncResult<U, E> => {
  const resolved = await result;
  return resolved.success 
    ? asyncSuccess<U, E>(await fn(resolved.data))
    : resolved;
};

// === Validation Helpers ===
export const validateNonEmpty = (value: string, fieldName: string): Result<string> =>
  value.trim().length > 0 
    ? success(value.trim())
    : failure(new Error(`${fieldName} cannot be empty`));

export const validatePositive = (value: number, fieldName: string): Result<number> =>
  value > 0 
    ? success(value)
    : failure(new Error(`${fieldName} must be positive`));

// === String Utilities ===
export const truncate = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : `${text.substring(0, maxLength - 3)}...`;

export const sanitizeBranchName = (name: string): string =>
  name.toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
