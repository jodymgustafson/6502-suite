# 6502 Suite
A suite of tools for assembling, disassembling and emulating 6502 microprocessor machine code.

## Assembler
The assembler takes a string of assembly code and turns it into an array of machine code bytes.

`assemble(code: string): number[]`

### Example:

```javascript
const code = `
  LDA #$F1
  STA $0600
`;
const bytes = assemble(code); //=> [0xA9, 0xF1, 0x8D, 0x00, 0x06]
```

In addition to the standard 6502 op codes this assembler supports the following:
- *=[number] - Defines the starting address of the code for computing offsets
  - `*=$0600`
- label_name: - Defines a label that can be used as a reference for branches and jumps
  - `start:`
  - `BEQ start`
- define [name] [value] - Defines a constant that can be used in place of numbers (can be shortened to DEF)
  - `define charout $0FA0`
  - `JSR charout`
- DCB - Declares one or more bytes at the current address, including strings
  - `DCB $0a, "foo", $2a, 'bar', $4a`

### Tips:
- The assembler is case insensitive, LDA === lda
- Numbers prefixed with $ are hex, % are binary, otherwise decimal
- Everything after a semicolon is ignored (comments)
  - `LDA #$01 ; set accmulator to 1` 
- Ending your code with a BRK (break) will stop the emulator (see below)
- Reference here: https://archive.org/details/VIC-20ProgrammersReferenceGuide1stEdition6thPrinti/page/n155/mode/2up

## Disassembler
The disassembler takes an array of bytes and turns it into an array of disassembled instructions.

`disassemble(bytes: number[], baseAddr?: number, startAddr?: number, stopAddr?: number): DisassembledInstruction[]`

### Optional Params:
- baseAddr - Address of the first byte in memory (for computing relative addressing), default is 0
- startAddr - Address to start disassembly at, default is baseAddr
- stopAddr - Address to stop at, default is undefined

### Return Type:
```javascript
{
    /** Address the instruction starts */
    address: number,
    /** Number of bytes for the instruction */
    bytes: number[],
    /** The assembly instruction */
    assembly: string;
}
```

### Example:
```javascript
const result = disassemble([0xA9, 0xF1, 0x8D, 0x00, 0x06]);
result[0]; //=> { address: 0, bytes: [0xA9, 0xF1], assembly: 'LDA #$F1' }
result[1]; //=> { address: 2, bytes: [0x8D, 0x00, 0x06], assembly: 'STA $0600' } 
```

## Emulator
The emulator is an object takes an array of machine code bytes and executes them.

```javascript
const em = new Emulator();
em.load(bytes);
em.run();
```

### Constructor
The constructor can take an optional paramater for the cycles per second.

`constructor(cyclesPerSec?: number)`

### load()
Use the load method to load bytes into memory.
The optional startAddr parameters tells it where in memory to put the bytes. If not defined it will start at zero.

`load(bytes: number[], startAddr?: number)`

### run()
Starts running the processor until it hits a break statement. Takes an optional parameter to tell it not to stop on break.

`run(stopOnBreak?: boolean)`

### step()
Executes only the next instruction at the current program counter and returns the result of the execution.

`step(): ExecutionResult`

ExecutionResult is an object with the following fields:
- isBreak - Will be true if the instruction was a break
- cycles - Number of cycles the last instruction used

### halt()
Stops execution after the current instruction finishes.
Don't assume the processor has stopped until the onStop event is received.

### reset()
Resets the CPU. If the optional hard parameter is true it also resets memory.

`reset(hard?: boolean)`

## Event handlers
The emulator provides two event handlers.
- onStop - Called when the emulator has stopped
- onStep - Called each time an instruction has finished

### onStop
To receive a callback when the processor stops register an event handler.
The callback will receive one parameter which is the reason the processor stopped.
Its value can be "user"|"break"|"error".

`em.onStop(reason => console.log(reason));`

### onStep
To receive a callback when the processor completes an instruction register an event handler.
The callback will receive one parameter which is the execution result (see step() method).

`em.onStep(result => console.log(result));`

### onBatch
To receive a callback when the processor completes a batch of instruction register an event handler.
The callback will receive one parameter which is the number of cycles completed in the batch.
When running at high cycles per second (more than 1000) it's advisable to get callbacks per batch rather than per step. 

`em.onBatch(cycles => console.log(cycles));`

## But Why?
Nobody in their right mind writes 6502 machine language anymore.
There's not a huge market for it these days.
So why did I create this project?

I learned to program on a Commodore C= back in the 1980's.
I guess it's just nostalgia for me.
But besides that I think it's a good learning tool.
The 6502 is a simple processor with a realtively easy to understand assembly language.
If you want to learn how computers actually work inside, close to the metal, then the 6502 is a good place to start.

## OK, but why an NPM library?
I wanted to make my own 6502 emulator web app.
There are some out there, but they look like they were made in 1998.
So I wanted to create a really good one to do some learning on.

There are some 6502 NPM packages out there but they have no documentation.
So I decided to make my own and document it so others could use it.

At first I was going to just take some existing code from those other projects, clean it up, and make an npm library out of it.
As I dug into them I found they had UI code mixed in with the other code making it impossible to use outside of that web page.
I tried to remove it, but the code was so bad with hardly no comments or good naming conventions.
It looks like it was ported from C or something.
So finally I decided to just write my own versions of an assembler and disassembler borrowing a little here and there.

Bulding an emulator is a lot more involved.
So I just included an existing implementation of a 6502 CPU emulator (thanks N. Landsteiner) with minimal changes.
Then I created my own emulator class as a facade to the CPU emulator to control access to it and provide utilities.

Code hard! - JM Gustafson
