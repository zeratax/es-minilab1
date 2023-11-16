import { createMachine } from "xstate";

interface Context {
  counter: number
};

type Guards = 
  | { type: "isValid"; params: { maxCount: number } };


// Edit your machine(s) here
const machine = createMachine(
  {
    types: {
      context: {} as Context,
      // The events this machine handles
      guards: {} as Guards,
    },
    id: "machine",
    initial: "inactive",
    context: {
      count: 0
    },
    states: {
      inactive: {
        on: { TOGGLE: "form" }
      },
      form: {
        on: {
          submit: {
            guard: { type: "isValid", params: { maxCount: 50 }  },
            target: "inactive"
          }
        }
      }
    },
    predictableActionArguments: true
  },
  {
    guards: {
      isValid: ({ count }, guard) => {
        return count > guard.maxCount;
      }
    }
  }
);
