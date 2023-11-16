import { createMachine, assign, raise, createActor, fromCallback } from "xstate";

interface Room {
  ist_temperature: number;
  soll_temperature: number;
}

interface Context {
  room1: Room;
  room2: Room;
}

type RoomKey = keyof Context;

type Minute = number;

const scale = 1 / 120;
const oneMinute: Minute = scale * 60 * 1000;

type Events =
  | { type: "init!" }
  | { type: "next" }
  | { type: "leave" }
  | { type: "off" }
  | { type: "isCorrectTemperature" }
  | { type: "cool" }
  | { type: "isTooHot" }
  | { type: "heat" }
  | { type: "isTooCold" }
  | { type: "timetableOn" }
  | { type: "timetableOff" }
  | { type: "windowsOpen" }
  | { type: "windowsClose" }
  | { type: "increaseTemperature" }
  | { type: "decreaseTemperature" }
  | { type: "cold_air" };

type Guards =
  | { type: "isTooCold"; params: { roomKey: RoomKey } }
  | { type: "isTooHot"; params: { roomKey: RoomKey } }
  | { type: "isCorrectTemperature"; params: { roomKey: RoomKey } };

type Actions =
  | { type: "decreaseTemperature"; params: { roomKey: RoomKey } }
  | { type: "increaseTemperature"; params: { roomKey: RoomKey } }
  | { type: "setTemperature"; params: { roomKey: RoomKey, temperature: number } };

function updateRoomTemperature(type: 'increase' | 'decrease', inRoomKey: RoomKey) {
  return function({ context }, action) {
    const room = context[inRoomKey]
    const outRoomKey = action.roomKey

    if (inRoomKey == outRoomKey) {
      if (type == 'increase') {
        console.log(`trying to increase temperature in room ${outRoomKey}...`)
        if (room.ist_temperature < 5) {
          console.log(`increasing temperature in room ${outRoomKey}!`)
          return { ...room, ist_temperature: room.ist_temperature + 1 };
        }
        console.log(`temperature in room ${outRoomKey} is already at maximum!`)
      } else if (type == 'decrease') {
        console.log(`trying to decrease temperature in room ${outRoomKey}...`)
        if (room.ist_temperature > 1) {
          console.log(`decreasing temperature in room ${outRoomKey}!`)
          return { ...room, ist_temperature: room.ist_temperature - 1 };
        }
        console.log(`temperature in room ${outRoomKey} is already at minimum!`)
      };
    }
    return room
  }
}

export const machine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QGUC2BDATgFwAQAkB7VMAOgFVYxNSALYsAYmwEsTt0AjAGzAH1CAOwCEAbQAMAXUSgADoVgtWQmSAAeiAOwAWUgA5xAZgCM2gKwBOEwDZDZgEzGANCACeWw5tLi9ms5ut7cWNA3wBfMJc0LDwiEgoqGnoSZjYwDh5+QgAzbLEpVXlFZUFVDQQdUmN7PWM7AM1NXz0zF3cEa21jfT9xfz1DAfF7awiojBwCBgTqOgZGXnQANzAJaSQQIqUWFQ3y+3svIMDOvV9NIMM2xFrdbRNDQwsLa2txULGQaMm4skpZ5JMADuLEEEEIQIEsjAIjWhQU212oHKF2uCDM2mspFe9jMT20OgsAW0n2+sWm-yS8xBYIhfAAxtwFGB8us5AiSmUtPYqk1quILOJNETDNZWm5EOZuuZxMNjPKQmZgoZSRNyfEAEqEYi4boAFTSGV4pBy2VS7C4vAEggA-HCNltOXtEMY+hZSI1tHoDk9cXoLNo0cZLN13iM9F6XvZBSTIl81VNNdrULrSAaLZkTYJzelLVlcnaCg6OTtSs6EK7LB6dN77L6zP7AxKK7Z3RZccZNH1tF7gyq42TE2QtTr9Ya81nvABaayMQRgNTYe3s4qlrkIGpYgOeOsWYPCgNBzo86whFqdfc9+yqmJD0gjlNjjPGoTYqfGCxzhdLosrxFl5FEDxHkzh0OttB8MNNCPbQTzPMwL38K8bx+aYH1TdNc0zV9XXfPQv0XZdNhLJF1C0Jp9BMapo1lQwRhguDrHPLokNglD1WHZNUwAYSEbBMEIbhSAAeVyRghELNliNXUj9g-fQoKad49wucV2iCHxSGeN4iW9CM62vAcE1+e8uO6XjBH4wSROzU1JPhGSALIjdOy03wlUsDFamCNEgn8fQGwbQwCWsAM9HYu90PMviBKE4Ts1oMB0Gwezi0c9dXS8QlnlMAk-BaewgwDd0RneOwQh8BCIpMqLSAsqy4uzeltW4VK-ydQCKyFD1tGePce0aQLCubYwWl0cRexCYU-H7cZbxqszSGQGFYEIGhRLNCSiMdNdy0cd0DECRpDpU3Eg0ed1g3uAkHjeTRqrQxblsEVb1tsgttpIpy5K8Cx3LdLzXWcEbBj0bwzzoqM6k7B6k1HJaVrWmzGES5LWQc-8Mu67L+ryoag0Od0ujOCNOjeWM5tQuHHwRl6kfixhmsE9G0sx8tMp6vrcsGgqg1G3RjlFUJDjqUYjPmx74ee17kdNFn2t2zqOZx7n8ocIMfDB55BgJPcrHc2GyAAdVBcEgVgUgaTN2AGSZKgIEYK2IRtwhoVtT70r2-ye1FANRujF4hSDMxumC55-QbPr9MN0gTdpc3LdN52oRhSBHaT83beZCA2uktnOvsL0PUCTFHFMYLPDUxBC6xBDcSFCw8TozEzAiONBEICA4FUQdfgxjrnJncQ0SnQvvFlCfJ4n2b4wl+JKX7xXnMLtFRUMaslRGGwxQFVvxapv5EjmEhF9kxAXmxAVPADV5zBDtEBi8QwJ4DBDerMEOY8pUgO+wPhAVPt9RAjwsShU8L4AMXY6iPAfp4Ugz9ZSv06I3T++8OKmVHIA9c75hrtD3OvTogwgrRkGHuGOtVMJGjAFg8soogw9nED0Kwo1TzvDfuQxalCJymhoUrRwYMSEf2DK8YKgRg5-Uoh-fBdEjBnA4fDLh2EnI7TPggCMwcaikA-vcZ+-hG62HCmgyKnDxxKOnNYXhzk6i4JdKeMGFxn7Ek9N6Cms8D4YJpool8gg3wfkseUTwv17ihWKgcWwVwRp2I9HWTKTw+idj3pTdBFDTHeKqOIPC-jECBHXqBJ4-oIwOFeEeUa0STBCjiSHPw8jPGpLIDhPQo9tBZLUaFSiro-ohWFCU+xMSKmCiqYktxyTFr1Vii0ywQYAhYk8CYA4spcTPzFkk4x8MxnWQ2i03RWjRp+E0KIkYsFfLxK0vsvsDhiaGRWQtNZMUNnKK+ljaCzYgi9VIDdc5hd-Y1NTNLNaEyLAa2CPA0aLQ5n3DODPXuksaZ-PWrkLZfQdnuX2aXY851vRVBMBBBBVgRE-O6HCmyLTMrnWFNibFRhEFCyhcZaYcdrYtJXs2Ww2Jsq616s8RwMcGXO0TvHG2jJs4tNglifhoUqm0WGL5VlBUBT3D0ZYQx1z6UZwtk7TOrtU4QBaaiF5p54EOD6JVIUiy25hCAA */
    types: {
      context: {} as Context,
      // The events this machine handles
      events: {} as Events,
      guards: {} as Guards,
      actions: {} as Actions,
    },
    context: {
      room1: {
        ist_temperature: 3,
        soll_temperature: 3,
      },
      room2: {
        ist_temperature: 3,
        soll_temperature: 3,
      }
    },
    id: "Smart On",
    initial: 'Off',
    states: {
      "Off": {
        on: {
          "init!": {
            target: "On",
          },
        },
      },
      "On": {
        states: {
          "User": {
            initial: 'home',
            states: {
              home: {
                on: {
                  timetableOn: {
                  },
                  timetableOff: {
                  },
                  leave: {
                    target: "not_home",
                  },
                  windowsOpen: {
                  },
                  windowsClose: {
                  },
                },
              },
              not_home: {
                entry: raise({ type: 'timetableOff' }),
              },
            },
          },
          "Room 1": {
            states: {
              Timetable: {
                initial: 'Off',
                states: {
                  Off: {
                    on: {
                      timetableOn: {
                        target: "On.hist",
                        actions: raise({ type: 'timetableOn' }),
                      },
                    },
                  },
                  On: {
                    initial: "0-6",
                    states: {
                      hist: {
                        type: 'history',
                      },
                      "0-6": {
                        entry: assign({
                          room1: ({ context }) => ({ ...context['room1'], soll_temperature: 3 })
                        }),
                        on: {
                          next: {
                            target: "6-19",
                          },
                        },
                      },
                      "6-19": {
                        entry: assign({
                          room1: ({ context }) => ({ ...context['room1'], soll_temperature: 4 })
                        }),
                        on: {
                          next: {
                            target: "10-18",
                          },
                        },
                      },
                      "10-18": {
                        entry: assign({
                          room1: ({ context }) => ({ ...context['room1'], soll_temperature: 2 })
                        }),
                        on: {
                          next: {
                            target: "18-24",
                          },
                        },
                      },
                      "18-24": {
                        entry: assign({
                          room1: ({ context }) => ({ ...context['room1'], soll_temperature: 4 })
                        }),
                      },
                    },
                    on: {
                      timetableOff: {
                        target: "Off",
                      },
                    },
                  },
                },
              },
              Control: {
                initial: 'Off',
                states: {
                  Off: {
                    on: {
                      "timetableOn": {
                        target: "On",
                      },
                    },
                  },
                  On: {
                    initial: 'Inactive',
                    description: 'increase/decrease temperature every 10 minutes',
                    on: {
                      timetableOff: {
                        target: "Off",
                      },
                    },
                    states: {
                      Inactive: {
                        on: {
                          heat: {
                            target: "Heat",
                          },
                          cool: {
                            target: "Cool",
                          },
                        },
                      },
                      Heat: {
                        after: {
                          controllerDelay: {
                            target: "Inactive",
                            description: 'increase temperature',
                            actions: { type: "increaseTemperature", params: { roomKey: 'room1' } },
                          },
                        },
                      },
                      Cool: {
                        after: {
                          controllerDelay: {
                            target: "Inactive",
                            description: 'decrease temperature',
                            actions: { type: "decreaseTemperature", params: { roomKey: 'room1' } },
                          },
                        },
                      },
                    }
                  },
                },
              },
              Sensor: {
                initial: 'CheckTemps',
                states: {
                  CheckTemps: {
                    description: 'check temperatures every 5 minutes',
                    invoke: {
                      src: fromCallback(({ sendBack }) => {
                        const interval = setInterval(() => {
                          console.log('checking temperatures...')
                          sendBack({ type: 'isTooCold' });
                          sendBack({ type: 'isTooHot' });
                          sendBack({ type: 'isCorrectTemperature' });
                        }, oneMinute * 5);
                        return () => clearInterval(interval);
                      })
                    },
                    on: {
                      isTooCold: {
                        guard: { type: 'isTooCold', params: { roomKey: 'room1' } },
                        target: 'tooCold',
                        description: 'heat if Solltemperatur > Isttemperatur',
                      },
                      isTooHot: {
                        guard: { type: 'isTooHot', params: { roomKey: 'room1' } },
                        target: 'tooHot',
                        description: 'cool if Solltemperatur < Isttemperatur',
                      },
                      isCorrectTemperature: {
                        guard: { type: 'isCorrectTemperature', params: { roomKey: 'room1' } },
                        target: 'CorrectTemperature',
                        description: 'cool if Solltemperatur < Isttemperatur',
                      },
                    },
                  },
                  tooCold: {
                    entry: raise({ type: 'heat' }),
                    on: {
                      heat: {
                        target: "CheckTemps",
                      },
                    },
                  },
                  tooHot: {
                    entry: raise({ type: 'cool' }),
                    on: {
                      cool: {
                        target: "CheckTemps",
                      },
                    },
                  },
                  CorrectTemperature: {
                    entry: raise({ type: 'off' }),
                    on: {
                      off: {
                        target: "CheckTemps",
                      },
                    },
                  },
                },
              },
            },
            type: "parallel",
          },
          "Windows": {
            initial: 'windows_closed',
            states: {
              windows_closed: {
                entry: raise({ type: 'timetableOn' }),
                exit: raise({ type: 'timetableOff' }),
                on: {
                  windowsOpen: {
                    target: "windows_opened",
                  },
                },
              },
              windows_opened: {
                invoke: {
                  src: fromCallback(({ sendBack }) => {
                    sendBack({ type: 'cold_air' });
                    console.log('cold_air!')
                    const interval = setInterval(() => { }, oneMinute * 5);
                    return () => clearInterval(interval);
                  })
                },
                on: {
                  windowsClose: {
                    target: "windows_closed",
                  },
                  cold_air: {
                    description: 'decrease temperature in all rooms every 5 minutes',
                    actions: [
                      { type: "decreaseTemperature", params: { roomKey: 'room1' } },
                      { type: "decreaseTemperature", params: { roomKey: 'room2' } }
                    ],
                  },
                },
              },
            },
          },
        },
        type: "parallel"
      },
    },
  },
  {
    actions: {
      increaseTemperature: assign({
        room1: updateRoomTemperature('increase', 'room1'),
        room2: updateRoomTemperature('increase', 'room2'),
      }),
      decreaseTemperature: assign({
        room1: updateRoomTemperature('decrease', 'room1'),
        room2: updateRoomTemperature('decrease', 'room2'),
      }),
    },
    actors: {},
    delays: {
      controllerDelay: oneMinute * 10,
    },
    guards: {
      isTooCold: ({ context }, guard) => {
        const result = context[guard.roomKey].soll_temperature > context[guard.roomKey].ist_temperature
        console.log(`isTooCold?: ${result}`)
        return result;
      },
      isTooHot: ({ context }, guard) => {
        const result = context[guard.roomKey].soll_temperature < context[guard.roomKey].ist_temperature
        console.log(`isTooHot? : ${result}`)
        return result;
      },
      isCorrectTemperature: ({ context }, guard) => {
        const result = context[guard.roomKey].soll_temperature == context[guard.roomKey].ist_temperature
        console.log(`isCorrectTemperature? : ${result}`)
        return result;
      },
    },
  },
);

const actor = createActor(machine);

actor.subscribe((snapshot) => {
  console.log('state', snapshot.value);
  console.log('context', snapshot.context);
  console.log(`soll temperature: ${snapshot.context.room1.soll_temperature} ist temperature: ${snapshot.context.room1.ist_temperature} `);
});

const sendEvent = (event) => {
  console.log('#####################');
  console.log(`event: ${event}`)
  actor.send({ type: event });
}

actor.start();
sendEvent('init!')

sendEvent('timetableOn')
sendEvent('next')

setTimeout(() => {
  // wait 30 min
  sendEvent('windowsOpen')

  setTimeout(() => {
    // wait 70 min
    sendEvent('windowsClose')

    setTimeout(() => {
      //wait 30 min
      sendEvent('next')

      setTimeout(() => {
        //wait 40 min
        sendEvent('next')
        sendEvent('leave')
      }, oneMinute * 40);
    }, oneMinute * 70);
  }, oneMinute * 30);

}, oneMinute * 40);
