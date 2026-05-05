import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';

const DeleteModal = ({ open, title, description, loading = false, onClose, onConfirm }) => (
  <Transition appear show={open} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : onClose}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" />
      </Transition.Child>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="comparex-card w-full max-w-md p-6 text-left">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-500 dark:text-rose-300">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-slate-950 dark:text-white">
                    {title}
                  </Dialog.Title>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={onClose} className="comparex-button-secondary flex-1" disabled={loading}>
                  Cancel
                </button>
                <button type="button" onClick={onConfirm} className="comparex-button flex-1 bg-rose-500 text-white hover:bg-rose-600" disabled={loading}>
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

export default DeleteModal;
