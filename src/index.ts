import { createMachine, assign, raise, createActor } from 'xstate'

/* eslint-disable @typescript-eslint/comma-dangle */

interface Room {
  actual_temperature: number
  target_temperature: number
}
enum Rooms {
  room1 = 'room1',
  room2 = 'room2',
}

type Context = {
  [key in Rooms]: Room;
} & {
  isTimetableOn: boolean;
}

type Minute = number

const scale = 1 / 120
const oneMinute: Minute = scale * 60 * 1000

enum EventTypes {
  Init = 'init!',
  Next = 'next',
  Leave = 'leave',
  Enter = 'enter',
  Off = 'off',
  Cool = 'cool',
  Heat = 'heat',
  TimetableOn = 'timetableOn',
  TimetableOff = 'timetableOff',
  WindowsOpen = 'windowsOpen',
  WindowsClose = 'windowsClose',
  IncreaseTemperature = 'increaseTemperature',
  DecreaseTemperature = 'decreaseTemperature',
}

type Events =
  | { type: EventTypes }

type Guards =
  | { type: 'isTooCold', params: { roomKey: Rooms } }
  | { type: 'isTooHot', params: { roomKey: Rooms } }
  | { type: 'isCorrectTemperature', params: { roomKey: Rooms } }
  | { type: 'isTimetableOn' }
  | { type: 'isTimetableOff' }

interface setTargetTemperature { type: 'setTargetTemperature', params: { target_temperature: { [key in Rooms]: number } } }
interface decreaseTemperature { type: 'decreaseTemperature', params: { roomKey: Rooms } }
interface increaseTemperature { type: 'increaseTemperature', params: { roomKey: Rooms } }

type Actions =
  | decreaseTemperature
  | increaseTemperature
  | setTargetTemperature
  | { type: EventTypes.Cool }
  | { type: EventTypes.Heat }
  | { type: EventTypes.Off }
  | { type: 'setTimetableOn' }
  | { type: 'setTimetableOff' }

function updateRoomTemperature(type: 'increase' | 'decrease', inRoomKey: Rooms) {
  return function ({ context }: { context: Context }, action: { roomKey: Rooms }) {
    const room = context[inRoomKey]
    const outRoomKey = action.roomKey

    if (inRoomKey === outRoomKey) {
      if (type === 'increase') {
        console.log(`trying to increase temperature in room ${outRoomKey}...`)
        if (room.actual_temperature < 5) {
          console.log(`increasing temperature in room ${outRoomKey}!`)
          return { ...room, actual_temperature: room.actual_temperature + 1 }
        }
        console.log(`temperature in room ${outRoomKey} is already at maximum!`)
      } else if (type === 'decrease') {
        console.log(`trying to decrease temperature in room ${outRoomKey}...`)
        if (room.actual_temperature > 1) {
          console.log(`decreasing temperature in room ${outRoomKey}!`)
          return { ...room, actual_temperature: room.actual_temperature - 1 }
        }
        console.log(`temperature in room ${outRoomKey} is already at minimum!`)
      };
    }
    return room
  }
}

export const machine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QGUC2BDATgFwAQHkA7AOnwDMyBiAS0OuwEIBtABgF1FQAHAe1nuo9CnEAA9EARgBsE4iwDsAVkUAmFQA4AnBO3zNAGhABPSQBZ5s05qlqJ0+efkqAvs8NoseIqRIBVWGCYxAAWPKhglNjU4djoAEYANmBErBxIILz8UUIi4ggAzDrE8vJSUupqUvmmijWGJgjlKsRSpoUsEnpOLIpSru4YOAQk3v6BIWERUTHxSeRkqSKZAjnpeYXqLZoqUpr5mor56hKF9YhVzcdKMvtOEhX9IB5D3qMBQaHhlEnoAG5gi3Sy2ywjWiHMpmKej2vQUmnUVkUZwQ8ny8mI+RYLFaKlKKhYhVMj2eXhGfneEy+AHdaBAeFTYPguGBCIDuHwVqDQOsJM1DvIWJo9FpTFInPJkYoKsRNNsWPjZU5MepiYNST5iGMPpNKDTCHSGQBhBJ8AHsJYckG5RCFWT7GrSRSaFjqRR2UyS-L5YjSVrqHpClRtIluJ5q4YagAq0TAsUSYGI0fCQRYAFopLgAJIAOUobIylsEXLE4KkimI5ix9oqpWdHuMkmk3ukrrhVnUxz6oZJEe8SdjswT-ZT6azuaYEjS7KyRetCFF5crBM0phruxY9YaEhdUgxihdvIh0NVnl7JH7caSiZjI4z+F8kcoolgsWwCfQZDfmAAFMhMwANAAJe8ACVkAASkoHtXnPGNLyHG85FHe9I3zYFZzBFFnWIXFRXKfZpG0TdGxXDEYSlFRCiOMoTxeMlrxmeMGPGKRU23Mc83NIFC1WblJGxSEZCcSjjnMHZkTsGwMXyN0HBkMtV3yWj1T7ODB2YoJWPYnM80nC0Z14ksEG3VoWk6NQjgkMSpAkl1y1k8wiKsstNGUs9mPgjSWjYlgCAfJ8X3QN9iA-L9vwAMVA4DfDAyDoPoi91OHbz2JQtCeOLPITlIt0VG2E4y12dR8gknRvVhHQen3I55TcmCPKSxDtzY9QOPSgzMskcpIRUKVrBXWVqlMYjjOkWR93uUxeWKlQrJVbtw3qxKmOS5r7javTuI6ucWx6vrdisPZhpG7cERaBErKlA98iDOqErUlamrTdaUIC1930-QJfwA6LYqgxb7sYq9Vue1q0q46dOTnfFZukqVhsk11etK7Zih2Z0hVXeQrjuqMHuBpr1FTIM2ohgttswtQDhabG8uG0opqcUqpBYFpyn3PR207XHVKBhDkx9ImSZ0icp3JqHKby8sxQqFdzFaczbOK4hW2OIMHGPBbTyW-H+fGe5idMPzH2fd6Qs+n8-yA0CIP+7XAYHR6BYNknwbF9DDLySjRR9UxsT6hQ8oMBsEGscsSnxRQShsHphp52C+eIQLgvQABjKJ-kiXX5naiW+PnMsKwFZdV1xdcTqsca0QPXpqgOLsBntvHE+ThNaDTjOpmzihc6tTDRXRCRejUVFa9piT9l3HYR9m6Qpp6ePiAAdVpelYGIVOTQCCBdVXhkmRZXuMPztpF2L6sy7rZE0WadmVxKf1ZrRReV-1NfiB4ZlCF3t+jS3s13YZTnKfIuVYVxriviHG6lwWZ+1RI-HYSktZ0Q1K-A069P4sjekFD6YVwqZgAGoAFEACyOYHxENtvFVBe8MFfyPp7RATpNiulqDscy5QTjIlmpoGU5QWadFRHYL0DcwxN28CBHgYRcCyENEIbAmAeAJGXrQg+389ToONKaBhnUEDqELtYVcQpqjVH4dw7Eu4ej4imqKYqJQQyNxQRIqRqAZHEDkYQBRSjiAABkwCfkoCyL8Oi5z6PLIYrQqJgxmJDvcJwxQrIdCmpiGwVRF6SOkbI+RijlH4FzBoteaiQmYTCXwoxUTTH6O4dIZodxZpRyqCcVc6SXFuI8V43JuYfj-GKfnUpETjHRKqbE-qGJirXRsTYRQLTMnuOyd4vJxBAJgCCtglOFtvyRiIdmMh2YKFUIBhqDJrismeJyaQbMSyVnYF6UZVQrNGbbFxNjIUbpzHSgFGWDQhRKjYhmScuZZyFmXLkUotZuCvpbJ2eQrZBzxEkGOW0+ZnS5lKNuXkN0Z8qyJMFFUGyIzBQ+m3FVeEVNZr-KRUClFS90ACEIFASgwRrnoqYUPUBBIcXWHyPihoahsRFzkvKUwahhUUtOR0i5y9aVRHpZQVOUiEgsoQJi9lhIsRcp5YgfEN0Vb+nhHoXkuIbpiuIMgFksAeBBBpXShlpscHmzwYQ0hMLKFxUOc42ZZrCAWqtdK2gUAlWSVkOMgUVh5K9SRCHSi1NUkblDWUHQ0zkEqQRa02QXqfXuKZanAA1pGMAqBmSYCCgAV0wHATigCKb5wVnIQidcERYhKNw1Q5VuUIl6vo2UojqEeoBRmy1WawC5vzYWwIpby2wF0lWvORla0dF2A2v2CgJRRpsLwlmegpQWBqFUeQJqB1BENNmvNBai0TorUwFQM6+41qmnWxd7Zl3NqjVEmUOwKjLhKPuBxYinGps9eawd2ApFyISDvQNY0VaYlDdYGpygW37Bwqw10pLuUHqA0EEDPBAI8GwJW-Ss6spQZDRuODUzI28taIJDcygxS7G0HsDD3rB1yMwOW9Oo7z3YDLRESDMhoMKDI+GhDr6rDvu5TdGO4CQyhkIDwCAcARDxUI7eoy6ZkSplFcm3sFBVPHyMsKiS5hZBlGFfiFmiCOzx304w4yegyIOhcnZd0yIagYjUDNSiClsYSEXlqWzujEGObdM510rmQ7DXLAiGSbQ8rCSjv5iknwwCBbnF6cqVh5bR3sBIZEqJ0S2JxDoCwTGdP1S1MQeT2AAD6KW0uYSjouKo+5VBlijtifLaIKz8OFSVsqi9lpJAa-nIM5Z7ShadC5qy+XtA+nYcVGpHRrPlYdp5YcI2jJ5W9BNx0zpwszZDuobGFZK7WJjtynt7qE6OwJgLNMGYcybfWPe3bYW3SHa3IKdEbpVwinMPuYqg3dZeQe8bZ75wLA+llIRBwbpIko29NiF0CpYGimB4nZKWlfJPa2kRxAK57JTRjtuAHdRYllTkCzT91gNzo9W83W7etNI+XB3jtTWVcSs1MTdToh1eoqBRs0EesJJPcrsBjpnXk1qtVx5DDnkhejlnuNUAUSMO2rq3DoYXuJRdVHF35hnvMpcgxamz+XBmsodl4fCY4-oo7wnuJq0ac37QjwJFiXErkjc3fW4TQ2Y4IcIFmqUFo8p1ylGo7UFGdoVzu8xPKPQku-fOyFkbFCQfep2ArAoVrdGtBBlKh2QW9HW1SgL8n9SrdM97BC3t6bJ1lQyn2F6VcTZthXfhQ1JircQrp2oP8IP1RY9OamwdiuQZijcrDV6LEZZK897Nu3fvg-2eW-OEcGmhQ3SDXaHl2Jwr0TeZnwnr5L9aGZ6qHX97EWtw6taL0ajqJBTD3P7-dem9TQQCH9nt7Y+PsjTT5QhBh2C5RCT7o+4qLv4fxfxB5iiyDdBYhDwLrBjXxKB7jLqdBii9D2BiqZ64jX7-635dTygqx2DYxOgmanQmrtI5KZ7oF-77YAESTrg+jVAzQyTIG8g0HIpQHoJqJB7bjVB7gEirjlC0wjT4gOAYgoFHS9Q1BIKOIprECIrirnJ+KfhB7WC7gRyURYGuh6AlSxIdisxcq-ZyjHaKF-rKGqGAoSp5JD6USEFMHEH2YlAVgNIP4mFWA8FUqSrLJBRB4WDBoF57D65hrBy8q8jojbAdhYwdiqC+H2EgoKpBHZ7W7bbhH9QSQHCQheiUQMxSjKBWRJHnKLLWoypQBD5Q6MEN45FRw4RChVALh+xxyQG2GHo147aE717j7cJN6YgJ4CRqB5Sd7-oqFpqmqYZSo2qCGq5oyIJTQWayiC5rp+zvqjFDw6BhrzRKHuQdHTHHrDqnpjrFo8aTpD6vY9E36fZarFzEBXTU6zRdoLztGTGHrEDYZgbf5r52aO4PFcomGdDcrwgtpWQPGWQySCjoyojMaZrYa4bYBaHSg3S1Cla9QFbqDcIyC8IGGzSjGMy7HWH7HvGHGWocbYBcbjrnGpa-G6K044QcraoHBNZYmvq9Q+h4j7YyRlj6KuCuBAA */
    types: {
      /* eslint-disable @typescript-eslint/consistent-type-assertions */
      context: {} as Context,
      // The events this machine handles
      events: {} as Events,
      guards: {} as Guards,
      actions: {} as Actions
    },
    context: {
      room1: {
        actual_temperature: 3,
        target_temperature: 3
      },
      room2: {
        actual_temperature: 4,
        target_temperature: 4
      },
      isTimetableOn: true,
    },
    id: 'Smart On',
    initial: 'Off',
    states: {
      Off: {
        on: {
          'init!': {
            target: 'On'
          }
        }
      },
      On: {
        states: {
          User: {
            initial: 'home',
            states: {
              home: {
                on: {
                  timetableOn: {
                  },
                  timetableOff: {
                  },
                  leave: {
                    target: 'not_home'
                  },
                  windowsOpen: {
                  },
                  windowsClose: {
                  }
                }
              },
              not_home: {
              }
            }
          },
          Timetable: {
            states: {
              Timer: {
                initial: '0-6 IN',
                states: {
                  '0-6 IN': {
                    always: [{
                      target: '0-6 OUT',
                      guard: 'isTimetableOn',
                      description: 'if isTimetableOn is true',
                      actions: { type: 'setTargetTemperature', params: { target_temperature: { room1: 3, room2: 4 } } }
                    },
                    {
                      guard: 'isTimetableOff',
                      description: 'if isTimetableOn is false',
                      target: '0-6 OUT',
                    }]
                  },
                  '0-6 OUT': {
                    after: {
                      SIXHOURS: {
                        target: '6-10 IN',
                      }
                    },
                  },
                  '6-10 IN': {
                    always: [{
                      target: '6-10 OUT',
                      guard: 'isTimetableOn',
                      description: 'if isTimetableOn is true',
                      actions: { type: 'setTargetTemperature', params: { target_temperature: { room1: 1, room2: 2 } } }
                    },
                    {
                      guard: 'isTimetableOff',
                      description: 'if isTimetableOn is false',
                      target: '6-10 OUT',
                    }],
                  },
                  '6-10 OUT': {
                    after: {
                      FOURHOURS: {
                        target: '10-18 IN',
                      }
                    },
                  },
                  '10-18 IN': {
                    always: [{
                      target: '10-18 OUT',
                      guard: 'isTimetableOn',
                      description: 'if isTimetableOn is true',
                      actions: { type: 'setTargetTemperature', params: { target_temperature: { room1: 3, room2: 4 } } }
                    },
                    {
                      guard: 'isTimetableOff',
                      description: 'if isTimetableOn is false',
                      target: '10-18 OUT',
                    }],
                  },
                  '10-18 OUT': {
                    after: {
                      SIXHOURS: {
                        target: '18-24 IN',
                      }
                    },
                  },
                  '18-24 IN': {
                    always: [{
                      target: '18-24 OUT',
                      guard: 'isTimetableOn',
                      description: 'if isTimetableOn is true',
                      actions: { type: 'setTargetTemperature', params: { target_temperature: { room1: 1, room2: 3 } } }
                    },
                    {
                      guard: 'isTimetableOff',
                      description: 'if isTimetableOn is false',
                      target: '18-24 OUT',
                    }],
                  },
                  '18-24 OUT': {
                    after: {
                      SIXHOURS: {
                        target: '0-6 IN',
                      }
                    },
                  },
                },
              },
              state: {
                initial: 'active',
                states: {
                  active: {
                    on: {
                      timetableOff: {
                        target: 'inactive',
                        actions: 'setTimetableOff'
                      }
                    }
                  },
                  inactive: {
                    on: {
                      timetableOff: {
                        target: 'active',
                        actions: 'setTimetableOn'
                      }
                    }
                  }
                }
              }
            },
            type: 'parallel',
          },
          Windows: {
            initial: 'closed',
            states: {
              closed: {
                on: {
                  windowsOpen: {
                    target: 'open'
                  }
                }
              },
              open: {
                after: {
                  FIVEMINUTES: {
                    target: 'open',
                    description: 'decrease temperature in all rooms',
                    actions: [
                      { type: 'decreaseTemperature', params: { roomKey: Rooms.room1 } },
                      { type: 'decreaseTemperature', params: { roomKey: Rooms.room2 } }
                    ]
                  }
                },
                on: {
                  windowsClose: {
                    target: 'closed'
                  }
                }
              }
            }
          },
          'Room 1': {
            states: {

              Control: {
                initial: 'ON',
                states: {
                  WindowsOpen: {
                    on: {
                      windowsClose: {
                        target: 'ON'
                      }
                    }
                  },
                  Left: {
                    on: {
                      enter: {
                        target: 'ON'
                      }
                    }
                  },
                  ON: {
                    initial: 'Waiting',
                    description: 'increase/decrease temperature every 10 minutes',
                    on: {
                      windowsOpen: {
                        target: 'WindowsOpen'
                      },
                      leave: {
                        target: 'Left'
                      }
                    },
                    states: {
                      Heat: {
                        after: {
                          TENMINUTES: {
                            target: 'Waiting',
                            description: 'increase temperature',
                            actions: { type: 'increaseTemperature', params: { roomKey: Rooms.room1 } }
                          },
                        },
                      },
                      Cool: {
                        after: {
                          TENMINUTES: {
                            target: 'Waiting',
                            description: 'decrease temperature',
                            actions: { type: 'decreaseTemperature', params: { roomKey: Rooms.room1 } }
                          },
                        },
                      },
                      Waiting: {
                        on: {
                          heat: {
                            target: 'Heat'
                          },
                          cool: {
                            target: 'Cool'
                          }
                        }
                      },
                    }
                  }
                }
              },
              Sensor: {
                initial: 'CheckTemperatures',
                states: {
                  Waiting: {
                    after: {
                      FIVEMINUTES: {
                        target: 'CheckTemperatures',
                      },
                    },
                  },
                  CheckTemperatures: {
                    description: 'compare target to actual temperature',
                    always: [
                      {
                        guard: { type: 'isTooCold', params: { roomKey: Rooms.room1 } },
                        target: 'tooCold',
                        description: 'if target_temperatur > actual_temperatur',
                      },
                      {
                        guard: { type: 'isTooHot', params: { roomKey: Rooms.room1 } },
                        target: 'tooHot',
                        description: 'if target_temperatur < actual_temperatur'
                      },
                      {
                        guard: { type: 'isCorrectTemperature', params: { roomKey: Rooms.room1 } },
                        target: 'CorrectTemperature',
                        description: 'if target_temperatur == actual_temperatur'
                      },
                    ],
                  },
                  tooCold: {
                    entry: ['heat' as EventTypes.Heat],
                    always: {
                      target: 'Waiting'
                    }
                  },
                  tooHot: {
                    entry: ['cool' as EventTypes.Cool],
                    always: {
                      target: 'Waiting'
                    }
                  },
                  CorrectTemperature: {
                    entry: ['off' as EventTypes.Off],
                    always: {
                      target: 'Waiting'
                    }
                  }
                }
              }
            },
            type: 'parallel'
          }
        },
        type: 'parallel'
      }
    }
  },
  {
    actions: {
      cool: raise({ type: EventTypes.Cool }),
      off: raise({ type: EventTypes.Off }),
      heat: raise({ type: EventTypes.Heat }),
      setTimetableOn: assign({ isTimetableOn: true }),
      setTimetableOff: assign({ isTimetableOn: false }),
      increaseTemperature: assign({
        room1: updateRoomTemperature('increase', Rooms.room1),
        room2: updateRoomTemperature('increase', Rooms.room2)
      }),
      decreaseTemperature: assign({
        room1: updateRoomTemperature('decrease', Rooms.room1),
        room2: updateRoomTemperature('decrease', Rooms.room2)
      }),
      setTargetTemperature: ({ context }, action: setTargetTemperature['params']) => {
        const targetTemperature = action.target_temperature
        assign({
          room1: { ...context.room1, target_temperature: targetTemperature.room1 },
          room2: { ...context.room2, target_temperature: targetTemperature.room2 },
        })
      },
    },
    delays: {
      TENMINUTES: oneMinute * 10,
      FIVEMINUTES: oneMinute * 5,
      SIXHOURS: oneMinute * 6 * 60,
      FOURHOURS: oneMinute * 4 * 60,
    },
    guards: {
      isTooCold: ({ context }, guard) => {
        const result = context[guard.roomKey].target_temperature > context[guard.roomKey].actual_temperature
        console.log(`isTooCold?: ${String(result)}`)
        return result
      },
      isTooHot: ({ context }, guard) => {
        const result = context[guard.roomKey].target_temperature < context[guard.roomKey].actual_temperature
        console.log(`isTooHot? : ${String(result)}`)
        return result
      },
      isCorrectTemperature: ({ context }, guard) => {
        const result = context[guard.roomKey].target_temperature === context[guard.roomKey].actual_temperature
        console.log(`isCorrectTemperature? : ${String(result)}`)
        return result
      },
      isTimetableOn: ({ context }) => {
        return context.isTimetableOn
      },
      isTimetableOff: ({ context }) => {
        return !context.isTimetableOn
      },
    }
  }
)

const actor = createActor(machine)

actor.subscribe((snapshot) => {
  console.log('########## NEW STATE ###########')
  console.log('state', snapshot.value)
  console.log('context', snapshot.context)
  console.log('room1', snapshot.context.room1)
  console.log('room2', snapshot.context.room2)
  console.log('################################')
})

const sendEvent = (event: EventTypes): void => {
  console.log('########## NEW EVENT ###########')
  console.log('event', event)
  console.log('################################')
  actor.send({ type: event })
}

// Helper function to create a delay
function delay(duration: number) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

// Main function to handle the event sequence
async function run() {

  // Initialize the actor and start the event sequence
  actor.start();
  sendEvent(EventTypes.Init);
  sendEvent(EventTypes.TimetableOn);

  await delay(oneMinute * 30);
  sendEvent(EventTypes.WindowsOpen);

  await delay(oneMinute * 120);
  sendEvent(EventTypes.WindowsClose);

  await delay(oneMinute * 120);
  sendEvent(EventTypes.Leave);

}

run();
