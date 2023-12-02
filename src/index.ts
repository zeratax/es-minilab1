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
  Off1 = 'off1',
  Cool1 = 'cool1',
  Heat1 = 'heat1',
  CoolRoom1 = 'coolRoom1',
  HeatRoom1 = 'heatRoom1',
  Off2 = 'off2',
  Cool2 = 'cool2',
  Heat2 = 'heat2',
  CoolRoom2 = 'coolRoom2',
  HeatRoom2 = 'heatRoom2',
  TimetableOn = 'timetableOn',
  TimetableOff = 'timetableOff',
  WindowsOpen = 'windowsOpen',
  WindowsClose = 'windowsClose',
  IncreaseTemperature = 'increaseTemperature',
  DecreaseTemperature = 'decreaseTemperature',
}

type Events =
  | { type: EventTypes }
  | { type: 'setTempManually' } & { [key in Rooms]: number }

type Guards =
  | { type: 'isTooCold', params: { roomKey: Rooms } }
  | { type: 'isTooHot', params: { roomKey: Rooms } }
  | { type: 'isCorrectTemperature', params: { roomKey: Rooms } }
  | { type: 'room1ColderThanRoom2' }
  | { type: 'room1HotterThanRoom2' }
  | { type: 'room1EqualToRoom2' }
  | { type: 'isTimetableOn' }
  | { type: 'isTimetableOff' }

interface setTargetTemperature { type: 'setTargetTemperature', params?: { target_temperature: { [key in Rooms]: number } } }

type Actions =
  | setTargetTemperature
  | { type: EventTypes.Cool1 }
  | { type: EventTypes.Heat1 }
  | { type: EventTypes.CoolRoom1 }
  | { type: EventTypes.HeatRoom1 }
  | { type: EventTypes.Off1 }
  | { type: EventTypes.Cool2 }
  | { type: EventTypes.Heat2 }
  | { type: EventTypes.CoolRoom2 }
  | { type: EventTypes.HeatRoom2 }
  | { type: EventTypes.Off2 }
  | { type: 'setTimetableOn' }
  | { type: 'setTimetableOff' }

export const machine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QGUC2BDATgFwAQAkB7VMAOgHkAzSgYgEsA7O7AQgG0AGAXUVAAdCsZnUINeIAB6IAjADZppAMwAmAOzKArGuXL5qrQBoQAT0SbVCjRx0BOAByy7GjYo2yAvu6NoseIiQoGUgAVAAswTAwAGwB9ACN0KPQGAGMwGglYbHRsMnRKXMwACnIAOQBRfHIAVQAlAEoaHxwCYjJyILCI6PjE5LTOHiQQASFsETFhqQR1G1JZRWtVABZl6WVpGxsjUwRFTdlSK1nVDlVZfWVPbwwW-3aglPCUgGsYrsjE3qTU9MHxUbCUTiaaqRRzBZLVbrTbbEyIFTLZSkc7KJzLDiyDhWDTXEDNPxtQKkJ5gV7vcKfWIJH5pGhsaRDfiCIGTUDTaRaDRHZaKBzWaTYuw2WQ7BGKLFKKwi1Y2DQOBZ4gmtAIdEnPN4fHo0-p-ZRMkYs8bAqYyLk8vlYjZCkVivbLc6kaFg6QSjSqOxgpW3QmqoLVWARUihNo0cYkbJxKJgDr-YaA41syQIzZO5waaQrHHyOx2xHLUjSOzLDOqCxWeTe3wqh6kANBkMkMN0CPoKMx6hx5ljCYglN2JSnEu6DiKDEYxR5zYFmxj7HaUduKt3Ilq+uYYOh6PoABuYC7hp7JvZiAdilIwo4RYWayvs8n8L2ynsRxcq1kNmxHA4dmXvtr66bk2ADujAQIQwGwOQfBgAwB4Jr2pp7OspAbLo+jLDYaIWLIGhTiW8x2K4nrqG4ViKH+NbEoBjbpKBDDgZBADCUSCPu3AAkaiEnshChnIoijnBws7KD+ebCYcvL7DoYLCSWFFePiPpUWqwQtmAkbRiE6kbhwAC0si4AAkqU9IcfGXHHsmCAOtyGKYmidicnYmiio+yxOKhjhEfsHAeRmsjLJR9zEmprbttpJC6QZxmmQyBoIVZ0y2U636yI5zmuXaGJzAKDgOoKixpcFq6dOpmlkGFQb6YZNTBBkWQ5HkBQREUyBGQAGlUdTII0yohap5VtlpVXRbV1TBPBllJqCWwXk5NhlhsRbFnhj4BV5IpFq6okih4in9aVkUacNlU6fMemCrFZkJdNfYIIKYKkDYRYuK6s6ehm2XFk6riYYt5ZFmoJV+sdFXHRusiXRw13xZxR4zTI-HPa9+zgny+jSNlP6FnYTjOIFcp3riB3KQNZXhSN51Q1ddUNdkuSkPkhRFAAYjUtTdbUvVNGTR1VeDo0XbTE1TQj93SBOqGZrh5xyB6a27BmdkSvskv2M4Vyk9W5Ng6dEOFvpRaw+Z3ashLH7IrI6WS1yV5jorp5EfMArW7yTnFjYIO1gL+tC4Kl12LDjLw+bSFyFh8w28OViuiW2OqFKWg6Ps8iOPtNw6-zQ0Rf7RtB3TmQM81LPtV1HM84doO+7n50B8bdVi2HPGic+hYCS4gkuJixZ2hmBZWotTm4RsDje6FOdU1FuN6coywm7d4tIcoiznhHw8-rouHLN9yLnHjAmCv5nLj4NlNndPRaz-PJn0iHFlLy3q+Fh+G8udbGg7+5mJHKPgUWKOb8mJT4UxOrXS+dhr64ELo1RmzNWply5pXPm1dJ4XyDFfOe0DRam0PM3ayK8XDzElulIB7oPIPl2I5FEagMSuWEi5BSmcVyoPPqQWBeQUjjD3M2c+VBKBN0TPdZYuFUoOTxplNwdonIKBEc+YSJDZybBAXrCKHDSCMHQFwugPDwxgOjPwwR3FrIiMTpvWOn4V5ljLHaCwidRKCTng6Ra8pfzaxYT7NB7Di4aIYFo7h6RAzYGCGAVAfAACyyQACuiQojGCMUlRACxzx+SxCoMEGx3a2MEqQH8MpeQiScG45h-5iQAHUwIQVgCSVigYIA0HooxKCME4K4MSojGyrgxEaC2N5D0Y47TSAOEcLYVi-LOH6SoipDEqmkEIC0hplTmK1PYovfByUun2R6SKPG-Sv67CGQ6JQHklpfk9M+KZSzqnzNgvTJqTMWrFFZkZAAauUcJJkJrlGQVnUG0ymlzJaQkjpPSBwbBWOCTEqsPyDL8jOUcwolqLVEqoFRtRCDEFwAoEJYSIg5CiZgMg0gaDhByOi4g0hgX3S0DOGwHkV6FUtFjdy6xuRaAsERQKK80RooxagLFIRQkwUwPiwlqEaApAxVEclqBKVtLukhLQhxLiBW-EPD8zLdhrBWCiMsvJdCHNRe40paoZUCpxcK0VZBlAkrAGSvlcq1lCMVXPZ6dLGGMocJq08OgCzWBkarTM4JeWYuxUKvF2ACVkEUBKqVMrHWh2dTxGlbr6W+QEl67KahzxqE5SOH8TkQ38rDbikVkaxUxtJdgeNVKXW0rTZ6+Q2VBIKDLFhLCPTrBYSLea8NZao1OljYQaVDra3Jt0CiJV9l1UvWbToX+XrOSnGsEFY1KkghmpLZa8tZBli2vtRSsd1liwKE2Nid0XK5TKGbTqtQn5zhuDPD2rdEaB0aCHSOw98rH7HqRM9ChKwFgQswnO7k-qXL6DlPKDOSlfm1k3aQJiohsCYGHaQf5VToK3MaVUlibEj3TAcGy9QmIVpQcMO5OwV4jijjWOrLQZxn2IeQ6hqIpAAAyYACg0FgoUAjiAiNHBIzmYU6Zr3uSxHMZwDhLxzxciTEp67SAIaQwwFDaGyiLJmZBLDrSnXGMI6I90okRPkfE1qxFTp9BLVkuCYpsGPHEhUyxjTpltx7n4wgQTxnSN4zM9lU4bLFhESRGOeSTHVPqbY2UUg+A7XYDuXAx5RRgjlFKB80oXyfmOdNXygVkXWMUFKLF+LnmGPHPxj0oSpxVDfSLLkj8x85DCSYQ5k1G68sKAK655jw7Esl1aql9LnzUvZfa8pzrzG1OFZi0h4dZXORiPShI+UWUJMiIa7LQUz4ywRZc9F4rZT0DCAYFAfd2AE0P3WYgZWS2Mqrake5OlHALw6HdCsZ8wotaKd1s56bPWjsnbO5K4dl2zZJusrd+yy2nIPbclq-eF5Ngr3kCIuUTHkCwVgIQDcgPxinf6w8lmzy3kZay31FB8HJuY4YNj3Hx38dQE80MyUeNrAZqLDleHCJ5QD0-i9HueMqMwarlT0NpAad08QxqC1r7CWwBuomgzSSMTzBWOe-nX3ud7AsMiDyMnXR+XlhjrHOPpdkheLL-t8u776cSQgVVauMTpkwlrvMHslCzjSZmVxq6ftHQQ5Ls3TEZd9qtQrtg+olf28dxcZ3zhXdYW1+CFePINY-kEulRwJvadm+wBipDUR6nM+a-NdnfJOcSTzOoMFAlaMZhcSfNdv3qem43PnwgRAEsl9Z1RleFfixV8fHyASSgvsuW2phDyOepdIcwISrhVurWK6uxDjkpe2f949lzvMH0eSa3sPqwSPbkRL53YWc7MrlBlddVsBto4mWDL2iiUc1iekVh5c3gPeXT9h-PzakHT9VAa-b9a7BAFNO-D1B-TNR8USRbOUOhXCLlbEP3NrJTM1X-UtK1cVKtK-G-etKAjNJtWAzEbkUSWUTkeUF6aQE-QVLA8-GNQAvA0AtfG7Cdc4McJwTEJA-QO0ZaAsEsTCMiFwNOWgs-AdSteLZgu3EFW-d1BlaA4gqhOQc8QLJETkChDYVrUXJzH-Og7dAdPdJgvlEAmQ6lOQ+-Ig71BAHQFCKDPGbeRYXQbQynXQzFTAgwsVPdXAkw-A1NQgx-WAtWNMRwOQFwOeCUI1f3UGDA-QuXMgd9Yw4gUw6PWQ5VG8Lgj+C4R2Gw3QZEEzVwTkQSF0FwuDNw-lZEbrNjDDHTBZHDZZfDFg5XLzIzYTMjMTPgsEAcUIzMZraglYWgqojjLjBLXjCITzbzNovzDo2Az+ZVaFCUO-dYQY-bIrLTJpXTCY1okzdozWPgkLeYFwd0AmcEKItAlvdwqbKLNY9zVZVI+6SYnY6YvY2ArlF-T0C4beXQBTc47-S4oYmLOLHIQneBYoIbMnUbCnMo3Lf41YwE0rJo+3crTg9MRaLEGrTo5wVCB0beGrC4TMFY-7A7XrKIEE5LcEkbb5KEnLDrWEokorEkhbOyNKe7eTbXTQZ2JxYSMELYeWH4nQmEioq4mbQ7BnRgM7KtFI1fZoqHFklbNk-Yj0XJb8FYU4TJM4gU2koUgE0UoHD9KU8HGUxbaHVktbKhQLN1DlRadYPab7X4mIvQoPenPUoue5UEtmV5d5SksbdAx0tvdDMU07HvF7TfDnQfW0R8SWTQC8fYCDERZJCUWgp083V4cQm3TzWPdXF3ewJPQZZwc8D+T+ERFyPyT-aIsXIU5MkPC3NMuAW3e4pCTM+PTXXMyM3CKTIcQKdYXCYBL-B0y4qs0PegqNCPKPaUmPVXOPDXRPXQQZc4AsdQfE9Q5wawJM-0jvQvYvREjpFnEMvvMMnfSMtwOYHKYUa2Qfb8ezTUibAc9cjFLvFfQ0+3XcsvLfSvCMg5OPI4a2SWXkEsYDNc3PDcOfBfYJP-KNR8vBVgh6DffcgfQ8g5NtGhFeESZadYI1RSBgQgCAOAcQUXBsniAyO0AyF7IBMi8igkvs9oagAikxczMwd0BQEfELTCLtASEBWijkVQXKMETPFrUSKjShMwRObaQSl6NwIou068rUL4HUX4TimQGrXJS8ZwZyH8HIscdKXJRYLCDYN6f+FRUkckGS6kPoeS8cjpNEPiXioSESMSYfDGC8Ucag4Ua01wFRdcBSmwhYXJGyyTFQey3YIqOYTQGEOAvQZwDywMDcWiLygSZED2DQ-GKjEDYfT7X6V3NQbk62KS1wtcaK0gLC7AGIWKiy6lHVNVeUecNwCwOEIK9Kv8+wLKtE9KFRGuaMLyueMDPy-in8UcQZSWJQBYRwbixYHpOPNqrxUaTq2cXygSWygK3MEgywEsT+Gld0UTUomk1RKeaqGKEyOKtYOaviuypapWIZXJT7L8OUYeT0SathIWGqbBYILyxwF7BPdQVYLXWrdaQa3CLuQQkseTe6-RdBSGaGWKLyhAkZdYcg3o3ivuP6lwDCIsh7EGwWamCGuqLy9CnivI04C4VOHIjMc8Es9Q5aOeWcdGv2OufOSGsq8Od0c8ASKfR6DksERG0m8gtCIZSmra8bdqsGw2QOZ6nGyzYeOeYSQhfQM6m7Owz0H8D0NtTkL2KiieB6uuSBLBA6hmluIsUmpEDlIcbQbXDMZEewU4T0EicS1W8s9W0Gg2TBeebG3WghKwAcFQcEIZfQeQM4LNPXK8EeTJewQ5amtRYuGalJHq06u0SES668HCEsa2MOrSdRfxHRMAQ66y+a-ygS6RaM84TGcSlYJyDUvK0BcGdRTRbRPcV6nVZOFK4sB0YeaRCUCrTGPkELZOtWtUGo+AV26YZw46havOx8OUROdQTYBW+jXsu23uq5GpNiCAOKi6-iE6xagavGT3d1SenMtYS5bTa5FpOul7a2S4G2z8RwAal8ewM4acY4HpZ9TqtQYe3OvqoS+0QUVCF6MatEVi3QJjWsyO1+3q2WmyQBSdSWFQMIjWfk8um84tOI63IlLOkBmOllTMZ6DuKgqFV6QB8CsVZQOu+xDVU40FOQbKZyC8OhLMj8H8fB4citVBtekewKn1aMm2ewIpcEVqnurU3tRh3dYhzad6SDFu9yfYGcVwVuJwceq8+BhDWso4KG52ERDyZrYcRaD+3kTB3kBjNEd-XbPhhB-LfbTq-QNBje9yQ23+FxGW-6Mu6E-hrrVYvu3THGh-MfS8bs1YH8bXDyYSJ0a2O+jMRuvbekzjAoKG0RJyTeP6FYOUbRvQX+OOT8HE7uue5x4U1zOK1PFht+sBksQaiwW2GSJEbEcJ64+EnILykp7EgJl6a2WcGxSjLS-pNwHo5wypkUkk2pi6pxKjRpj8Yo7KOhlEFKr2refm308XHUgMoHOKiwSx0erVYZlEQQymoZFQTQGfHHYB-J0BvMTCROM8PSrYEUL0YxwPf0vHcUnGzS6WLIh-UsjSlyE8uedKNRt7Rx7a65oClMy3Ah3CgehEI6g59BoKvzXJEsb8PkewPkXKpxkxhQZMjc4dZekFhAAGeYDyT8AXVVTQavUcVCd+YUIsM4Gq3Z9ve8wgbAKGpUruT8bgs4Ohd3HGd2L3YsHZq51vf5kCskMCwRqGnpElxYfyKwUjXfV0EZUJmFpEJEeRpFjA5+sxaOxa-qyM0KoJmRNEVwd1MQoF-ZtVlZmQT0BQLCFydQ1YXVg1wRwsOuuYEOj0WFueRyJ-EVoZK8LQWR7EFQW1zw61Zh41thh6HZb+h9TQB0AxuBpVvQpRxQB156UuqjUcV1vGPghhI4GWVyhwNQIsf1+Ip0INnOw52AsI7+57Ip+KmN35uNoF5RzFi4R15Nl1hVsBt7AedYELJyGF6Zi47UsxzFtQbqktiFswCUBcs4Ky9lKMwk64tx4+zFxlLxz8HxjEBwTojbQKdGfJdXVA682IoYyJulzFkUbkWJxhT+BJlwPghPeYXk-YMEciGt8bQ9uE0oXJqO0dqxqhIp+aF6XStYF6RF2tukqp4rIEk9p8jpOpgZhRJpkZ2A7ix1vQCd-1fenlsDnpubKIPphQODoZ5pn6qhdKROG6zMPFqSH519vQuZ2507RZ7O9ek17yxYZ6BlQKT0SxW2+0is3AZEJ0o179lj10PkQ478QhY4fNzDysm5wMqAe5jbDYJ5uvJEHI+WU+r1tYIDgBfdhRv0vlocgN-u6D+6McJj1hsBoNF7Ww7ySEcEdHGT-jiXO8wgTc+l+YrMLZhAjyPM1YNMEUbEG6jYQCqXDvLvelk5wKXkfpZpx7T8zCYheUEQ2Eb10L4PHHUCoB09kV3VvyfGNKawn3Bcyeq8Kyj8EmTwIAA */
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
        target_temperature: 3,
      },
      room2: {
        actual_temperature: 4,
        target_temperature: 4,
      },
      isTimetableOn: true,
    },
    id: 'Smart Home',
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
          Thermal_balance: {
            after:
              {
                ONEHOUR: {
                  target: 'check_Thermal_balance',
                }
              },
          },
          check_Thermal_balance: {
            always: [
              {
                guard: 'room1ColderThanRoom2',
                target: 'Thermal_balance',
                actions: [
                  'heatRoom1' as EventTypes.HeatRoom1,
                  'coolRoom2' as EventTypes.HeatRoom1,
                ]
              },
              {
                guard: 'room1HotterThanRoom2',
                target: 'Thermal_balance',
                actions: [
                  'coolRoom1' as EventTypes.HeatRoom1,
                  'heatRoom2' as EventTypes.HeatRoom1,
                ]
              },
              {
                guard: 'room1EqualToRoom2',
                target: 'Thermal_balance',
              },
            ],
          },
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
                      },
                      setTempManually: {
                        actions: 'setTargetTemperature',
                      },
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
                  windowsOpen: "open"
                }
              },
              open: {
                after: {
                  FIVEMINUTES: {
                    target: 'open',
                    description: 'decrease temperature in all rooms',
                    actions: [
                      'cool1' as EventTypes.Cool1,
                      'cool2' as EventTypes.Cool2,
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
              Temperature: {
                initial: '3',
                states: {
                  '1': {
                    entry: assign({
                      room1: ({context}) => {return { ...context.room1, actual_temperature: 1 }}
                    }),
                    on: {
                      heatRoom1: {
                        target: '2'
                      },
                    },
                  },
                  '2': {
                    entry: assign({
                      room1: ({context}) => {return { ...context.room1, actual_temperature: 2 }}
                    }),
                    on: {
                      coolRoom1: {
                        target: '1'
                      },
                      heatRoom1: {
                        target: '3'
                      },
                    },
                  },
                  '3': {
                    entry: assign({
                      room1: ({context}) => {return { ...context.room1, actual_temperature: 3 }}
                    }),
                    on: {
                      coolRoom1: {
                        target: '2',
                      },
                      heatRoom1: {
                        target: '4'
                      },
                    },
                  },
                  '4': {
                    entry: assign({
                      room1: ({context}) => {return { ...context.room1, actual_temperature: 4 }}
                    }),
                    on: {
                      coolRoom1: {
                        target: '3'
                      },
                      heatRoom1: {
                        target: '5'
                      },
                    },
                  },
                  '5': {
                    entry: assign({
                      room1: ({context}) => {return { ...context.room1, actual_temperature: 5 }}
                    }),
                    on: {
                      coolRoom1: {
                        target: '4'
                      },
                    },
                  },
                },
              },
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
                            actions: 'heatRoom1' as EventTypes.HeatRoom1,
                          },
                        },
                      },
                      Cool: {
                        after: {
                          TENMINUTES: {
                            target: 'Waiting',
                            description: 'decrease temperature',
                            actions: 'coolRoom1' as EventTypes.CoolRoom1,
                          },
                        },
                      },
                      Waiting: {
                        on: {
                          heat1: {
                            target: 'Heat'
                          },
                          cool1: {
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
                      FIVEMINUTES: "CheckTemperatures",
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
                    entry: ['heat1' as EventTypes.Heat1],
                    always: {
                      target: 'Waiting'
                    }
                  },
                  tooHot: {
                    entry: ['cool1' as EventTypes.Cool1],
                    always: {
                      target: 'Waiting'
                    }
                  },
                  CorrectTemperature: {
                    entry: ['off1' as EventTypes.Off1],
                    always: {
                      target: 'Waiting'
                    }
                  }
                }
              }
            },
            type: 'parallel'
          },
          'Room 2': {
            states: {
              Temperature: {
                initial: '4',
                states: {
                  '1': {
                    entry: assign({
                      room2: ({context}) => {return { ...context.room1, actual_temperature: 1 }}
                    }),
                    on: {
                      heatRoom2: {
                        target: '2'
                      },
                    },
                  },
                  '2': {
                    entry: assign({
                      room2: ({context}) => {return { ...context.room1, actual_temperature: 2 }}
                    }),
                    on: {
                      coolRoom2: {
                        target: '1'
                      },
                      heatRoom2: {
                        target: '3'
                      },
                    },
                  },
                  '3': {
                    entry: assign({
                      room2: ({context}) => {return { ...context.room1, actual_temperature: 3 }}
                    }),
                    on: {
                      coolRoom2: {
                        target: '2'
                      },
                      heatRoom2: {
                        target: '4'
                      },
                    },
                  },
                  '4': {
                    entry: assign({
                      room2: ({context}) => {return { ...context.room1, actual_temperature: 4 }}
                    }),
                    on: {
                      coolRoom2: {
                        target: '3'
                      },
                      heatRoom2: {
                        target: '5'
                      },
                    },
                  },
                  '5': {
                    entry: assign({
                      room2: ({context}) => {return { ...context.room1, actual_temperature: 5 }}
                    }),
                    on: {
                      coolRoom2: {
                        target: '4'
                      },
                    },
                  },
                },
              },
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
                            actions: 'heatRoom2' as EventTypes.HeatRoom2,
                          },
                        },
                      },
                      Cool: {
                        after: {
                          TENMINUTES: {
                            target: 'Waiting',
                            description: 'decrease temperature',
                            actions: 'coolRoom2' as EventTypes.CoolRoom2,
                          },
                        },
                      },
                      Waiting: {
                        on: {
                          heat2: {
                            target: 'Heat'
                          },
                          cool2: {
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
                      FIVEMINUTES: "CheckTemperatures",
                    },
                  },
                  CheckTemperatures: {
                    description: 'compare target to actual temperature',
                    always: [
                      {
                        guard: { type: 'isTooCold', params: { roomKey: Rooms.room2 } },
                        target: 'tooCold',
                        description: 'if target_temperatur > actual_temperatur',
                      },
                      {
                        guard: { type: 'isTooHot', params: { roomKey: Rooms.room2 } },
                        target: 'tooHot',
                        description: 'if target_temperatur < actual_temperatur'
                      },
                      {
                        guard: { type: 'isCorrectTemperature', params: { roomKey: Rooms.room2 } },
                        target: 'CorrectTemperature',
                        description: 'if target_temperatur == actual_temperatur'
                      },
                    ],
                  },
                  tooCold: {
                    entry: ['heat2' as EventTypes.Heat2],
                    always: {
                      target: 'Waiting'
                    }
                  },
                  tooHot: {
                    entry: ['cool2' as EventTypes.Cool2],
                    always: {
                      target: 'Waiting'
                    }
                  },
                  CorrectTemperature: {
                    entry: ['off2' as EventTypes.Off2],
                    always: {
                      target: 'Waiting'
                    }
                  }
                }
              }
            },
            type: 'parallel'
          },
        },
        type: 'parallel'
      }
    }
  },
  {
    actions: {
      cool1: raise({ type: EventTypes.Cool1 }),
      off1: raise({ type: EventTypes.Off1 }),
      heat1: raise({ type: EventTypes.Heat1 }),
      heatRoom1: raise({ type: EventTypes.HeatRoom1 }),
      coolRoom1: raise({ type: EventTypes.CoolRoom1 }),
      setTimetableOn: assign({ isTimetableOn: true }),
      setTimetableOff: assign({ isTimetableOn: false }),
      setTargetTemperature: ({ context, event }, action) => {
        if (action) {
          assign({
            room1: { ...context.room1, target_temperature: action.target_temperature.room1 },
            room2: { ...context.room2, target_temperature: action.target_temperature.room2 },
          })
        } else if (event.type == 'setTempManually')	{
          assign({
            room1: { ...context.room1, target_temperature: event.room1 },
            room2: { ...context.room2, target_temperature: event.room2 },
          })
        } else {
          Error
        }
      },
    },
    delays: {
      TENMINUTES: oneMinute * 10,
      FIVEMINUTES: oneMinute * 5,
      SIXHOURS: oneMinute * 6 * 60,
      FOURHOURS: oneMinute * 4 * 60,
      ONEHOUR: oneMinute * 60,
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
      room1ColderThanRoom2: ({ context }) => {
        const result = context.room1.actual_temperature + 1 < context.room2.actual_temperature
        return result
      },
      room1HotterThanRoom2: ({ context }) => {
        const result = context.room1.actual_temperature + 1 > context.room2.actual_temperature
        return result
      },
      room1EqualToRoom2: ({ context }) => {
        const result = context.room1.actual_temperature + 1 == context.room2.actual_temperature
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

// Helper function to create a delay
function delay(duration: number) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

// Main function to handle the event sequence
async function run() {

  // Initialize the actor and start the event sequence
  actor.start();
  actor.send({ type: EventTypes.Init })

  await delay(oneMinute * 60 * 9);
  actor.send({ type: EventTypes.WindowsOpen })

  await delay(oneMinute * 60 * 12);
  actor.send({ type: EventTypes.WindowsClose })

  await delay(oneMinute * 60 * 14);
  actor.send({ type: EventTypes.TimetableOff })
  actor.send({ type: 'setTempManually', room1: 5, room2: 5 })

  await delay(oneMinute * 60 * 24 + oneMinute * 60 * 6);
  actor.send({ type: EventTypes.Leave })

}

run();
