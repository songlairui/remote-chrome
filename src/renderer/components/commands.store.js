const commands = [
  {
    name: 'LINKTOINNER',
    cmd: ['ssh', ['-N', '-D', '0.0.0.0:1111', 'amarpc']],
    pending: false,
    pid: NaN,
    lastExecStamp: 0,
    lastExitStamp: 0,
    output: [],
    process: null
  },
  {
    name: 'LS CURRENT DIR',
    cmd: ['ls', ['-la']],
    pending: false,
    pid: NaN,
    lastExecStamp: 0,
    lastExitStamp: 0,
    output: [],
    process: null
  }
]

export default commands
