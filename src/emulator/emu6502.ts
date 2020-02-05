import { Cpu6502, CpuRegisters, ExecutionResult }  from "./6502cpu";
import { disassemble, DisassembledInstruction } from "../disassembler/dasm6502";

export type StopReason = "user"|"break"|"error";

export class Emulator
{
    private cpu = Cpu6502();
    private stopExec = false;
    private stopOnBreaK = true;
    private isRunning = false;
    private msPerCycle: number;
    private cyclesPerBatch: number;

    private onStepCallback: (result: ExecutionResult) => any;
    private onStopCallback: (reason: StopReason) => any;

    get registers(): CpuRegisters { return this.cpu.registers; }
    get memory(): number[] { return this.cpu.memory; }
    get totalCycles(): number { return this.cpu.processorCycles; }

    constructor(private cyclesPerSecond = 1000000) {
        this.msPerCycle = 1000 / this.cyclesPerSecond;
        // Set the batch size such that each one will run ~10ms
        this.cyclesPerBatch = Math.floor(this.cyclesPerSecond / 100);
        this.reset(true);
    }

    /** Sets the function to be called after every instruction is executed */
    public onStep(callback: (result: ExecutionResult) => any): Emulator {
        this.onStepCallback = callback;
        return this;
    }

    /** Sets the function to be called when executed is stopped */
    public onStop(callback: (reason: StopReason) => any): Emulator {
        this.onStopCallback = callback;
        return this;
    }

    /**
     * Loads an array of bytes into memory.
     * Be warned: if a number does not fit into a byte it will be truncated.
     * @param bytes Bytes to load
     * @param startAddr (optional) Starting address to load bytes
     */
    load(bytes: number[], startAddr = 0): Emulator {
        if (startAddr + bytes.length > 0xFFFF) {
            throw new Error("The bytes won't fit into memory");
        }

        //this.memory.splice(startAddr, bytes.length, ...bytes);
        let pc = startAddr;
        for (const byte of bytes) {
            this.memory[pc++] = byte & 0xFF;
        }

        return this;
    }

    /**
     * Resets the emulator's cpu
     * @param hard (optional) If true memory is cleared
     */
    reset(hard = false): Emulator {
        if (this.isRunning) {
            throw new Error("Emulator must be stopped before calling reset");
        }

        this.cpu.resetCPU();
        if (hard) {
            this.cpu.clearMemory();
        }

        return this;
    }

    /** Executes one instruction */
    step(): ExecutionResult {
        return this.cpu.executeNext();
    }

    /**
     * Starts running the emulator continuously
     * @param stopOnBreak (optional) If true will stop on a break instruction
     */
    run(stopOnBreak = true): Emulator {
        this.stopExec = false;
        this.stopOnBreaK = stopOnBreak;
        this.execBatch();
        return this;
    }

    /** Stops execution after the current instruction finishes */
    halt(): void {
        if (this.isRunning) {
            this.stopExec = true;
        }
    }

    /** Returns the dissassembly for the next instruction to be executed */
    getNextInstruction(): DisassembledInstruction {
        const bytes = this.memory.slice(this.registers.pc, this.registers.pc + 3);
        bytes.push(0,0,0);
        const inst = disassemble(bytes, this.registers.pc);
        return inst[0];
    }

    /** Gets the byte at the specified address */
    getByteAt(addr: number): number {
        return this.memory[addr & 0xFFFF] || 0;
    }

    /** Gets the word (2 bytes) at the specified address */
    getWordAt(addr: number): number {
        const lower = this.getByteAt(addr);
        const upper = this.getByteAt(addr + 1);
        return lower + (upper << 8);
    }

    private execBatch(): void {
        let cycles = 0;
        let time = Date.now();

        do {
            const result = this.cpu.executeNext();
            if (result.isBreak && this.stopOnBreaK) {
                return this.fireOnStop("break");
            }
            if (this.onStepCallback) {
                this.onStepCallback(result);
            }
            
            cycles += result.cycles;
        }
        while (!this.stopExec && cycles < this.cyclesPerBatch);

        if (this.stopExec) {
            return this.fireOnStop("user");
        }

        const elapsed = Date.now() - time;
        const expected = cycles * this.msPerCycle;
        const wait = Math.floor(Math.max(0, expected - elapsed));
        //console.log(elapsed, expected, wait);
        setTimeout(() => this.execBatch(), wait);
    }

    private fireOnStop(reason: StopReason): void {
        if (this.onStopCallback) {
            this.onStopCallback(reason);
        }
    }
}