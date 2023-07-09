import { useState } from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { EyeOffIcon, EyeOnIcon, LoaderIcon } from '@shared/icons';

import { useOnboarding } from '@stores/onboarding';
import { useStronghold } from '@stores/stronghold';

import { useSecureStorage } from '@utils/hooks/useSecureStorage';

type FormValues = {
  password: string;
};

const resolver: Resolver<FormValues> = async (values) => {
  return {
    values: values.password ? values : {},
    errors: !values.password
      ? {
          password: {
            type: 'required',
            message: 'This is required.',
          },
        }
      : {},
  };
};

export function ImportStep2Screen() {
  const navigate = useNavigate();
  const setPassword = useStronghold((state) => state.setPassword);

  const [passwordInput, setPasswordInput] = useState('password');
  const [loading, setLoading] = useState(false);
  const [pubkey, privkey] = useOnboarding((state) => [state.pubkey, state.privkey]);

  const { save } = useSecureStorage();

  // toggle private key
  const showPassword = () => {
    if (passwordInput === 'password') {
      setPasswordInput('text');
    } else {
      setPasswordInput('password');
    }
  };

  const {
    register,
    setError,
    handleSubmit,
    formState: { errors, isDirty, isValid },
  } = useForm<FormValues>({ resolver });

  const onSubmit = async (data: { [x: string]: string }) => {
    setLoading(true);
    if (data.password.length > 3) {
      // add password to local state
      setPassword(data.password);

      // save privkey to secure storage
      await save(pubkey, privkey);

      // redirect to next step
      navigate('/auth/import/step-3', { replace: true });
    } else {
      setLoading(false);
      setError('password', {
        type: 'custom',
        message: 'Password is required and must be greater than 3, please check again',
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-100">
          Set password to secure your key
        </h1>
      </div>
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="relative">
              <input
                {...register('password', { required: true })}
                type={passwordInput}
                className="relative w-full rounded-lg bg-zinc-800 py-3 pl-3.5 pr-11 text-zinc-100 !outline-none placeholder:text-zinc-400"
              />
              <button
                type="button"
                onClick={() => showPassword()}
                className="group absolute right-2 top-1/2 -translate-y-1/2 transform rounded p-1 hover:bg-zinc-700"
              >
                {passwordInput === 'password' ? (
                  <EyeOffIcon
                    width={20}
                    height={20}
                    className="text-zinc-500 group-hover:text-zinc-100"
                  />
                ) : (
                  <EyeOnIcon
                    width={20}
                    height={20}
                    className="text-zinc-500 group-hover:text-zinc-100"
                  />
                )}
              </button>
            </div>
            <div className="text-sm text-zinc-500">
              <p>
                Password is use to secure your key store in local machine, when you move
                to other clients, you just need to copy your private key as nsec or
                hexstring
              </p>
            </div>
            <span className="text-sm text-red-400">
              {errors.password && <p>{errors.password.message}</p>}
            </span>
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={!isDirty || !isValid}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-fuchsia-500 font-medium text-zinc-100 hover:bg-fuchsia-600"
            >
              {loading ? (
                <LoaderIcon className="h-4 w-4 animate-spin text-black dark:text-zinc-100" />
              ) : (
                'Continue →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
