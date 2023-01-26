import { Dialog, Switch, Transition } from "@headlessui/react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { Fragment, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { useZodForm } from "../../hooks/useZodForm";
import { trpc } from "../../utils/trpc";
import { Input } from "../Input";

const frequencyOptions = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" },
];

const HabitSchema = z.object({
  title: z
    .string({
      required_error: "Title is required",
    })
    .min(3, "Title must have at least 3 characters"),
  frequency: z.array(z.string()).min(1, "Frequency must have at least one day"),
});

export const AddNewHabit: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const handleCloseForm = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        className="w-fit justify-center rounded-md border-2 border-blue-900 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
        onClick={() => setIsOpen(true)}
      >
        + Add new habit
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleCloseForm}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-neutral-800 p-6 text-left align-middle shadow-xl transition-all">
                  <header className="flex items-center justify-between">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold text-white"
                    >
                      Create habit
                    </Dialog.Title>
                    <button
                      onClick={() => handleCloseForm()}
                      className="rounded-lg focus:outline-none  focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
                    >
                      <XMarkIcon className="h-8 w-8 text-neutral-400" />
                    </button>
                  </header>

                  <HabitForm userId={userId} handleClose={handleCloseForm} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

type HabitFormProps = {
  handleClose: () => void;
  userId: string;
};

const HabitForm = ({ handleClose, userId }: HabitFormProps) => {
  const methods = useZodForm({
    schema: HabitSchema,
    defaultValues: {
      title: "",
      frequency: [],
    },
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const trpcUtils = trpc.useContext();
  const { mutate } = trpc.habit.create.useMutation({
    onSuccess: () => {
      trpcUtils.habit.getAll.invalidate({ userId });

      handleClose();
      toast.success("Habit created successfully!");
    },
    onError: (err) => {
      toast.error("Habit creation failed!");
      console.log("An error happened: ", err);
    },
  });

  const onFrequencyChange = (option: string) => {
    const values = methods.getValues();
    methods.setValue(
      "frequency",
      values.frequency.includes(option)
        ? values.frequency.filter((f) => f !== option)
        : [...values.frequency, option]
    );
  };

  return (
    <form
      onSubmit={handleSubmit((data) => {
        mutate({
          frequency: data.frequency.join(","),
          title: data.title,
          userId,
        });
      })}
    >
      <div className="mt-6 flex flex-col gap-6">
        <div>
          <label
            className="mb-2 block w-fit pr-4 font-semibold text-neutral-100"
            htmlFor="title"
          >
            Title
          </label>
          <Input
            id="title"
            type="text"
            placeholder="My habit"
            error={!!errors.title}
            {...methods.register("title")}
          />
          {errors.title && (
            <p className="mt-2 text-sm text-red-200">{errors.title.message}</p>
          )}
        </div>
        <div>
          <label className="mb-2 block pr-4 font-semibold text-neutral-100">
            Frequency
          </label>
          <div className="flex flex-col gap-2">
            {frequencyOptions.map((option, index) => (
              <div
                key={option.value + index}
                className="flex items-center gap-2"
              >
                <Controller
                  name="frequency"
                  control={methods.control}
                  render={({ field }) => {
                    const checked = field.value.includes(option.value);
                    return (
                      <Switch
                        checked={checked}
                        value={option.value}
                        onChange={() => onFrequencyChange(option.value)}
                        className={clsx(
                          checked
                            ? "border-green-500 bg-green-500"
                            : "border-neutral-600 bg-transparent",
                          "grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 transition-colors focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75"
                        )}
                      >
                        <CheckIcon
                          className={`h-5 w-5 text-white transition-all ${
                            !checked && "opacity-0"
                          }`}
                        />
                      </Switch>
                    );
                  }}
                />

                <span className="text-neutral-100">{option.label}</span>
              </div>
            ))}
            {errors.frequency && (
              <p className="text-sm text-red-200">{errors.frequency.message}</p>
            )}
          </div>
        </div>
      </div>
      <button
        type="submit"
        className="mt-6 w-full rounded-md border border-transparent bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-400 focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75"
      >
        Create
      </button>
    </form>
  );
};
