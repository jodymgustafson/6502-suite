import { Cpu6502, CpuRegisters, ExecutionResult }  from "./6502cpu";
import { disassemble, DisassembledInstruction } from "../disassembler/dasm6502";
import { RandomAccessMemory } from "./ram";

export type StopReason = "user"|"break"|"error";

const DFLT_CYCLES_PER_SEC = 1000000; // 1Mhz

export class Emulator
{
    private _ram = new RandomAccessMemory();
    private _cpu: Cpu6502 = Cpu6502(this.ram.memory);

    private stopExec = false;
    private stopOnBreaK = true;
    private _isRunning = false;

    private msPerCycle: number;
    private _cyclesPerSecond: number;
    private cyclesPerBatch: number;

    private onStepCallback: (result: ExecutionResult) => any;
    private onBatchCallback: (cycles: number) => any;
    private onStopCallback: (reason: StopReason) => any;

    get ram(): RandomAccessMemory { return this._ram; }
    get cpu(): Cpu6502 { return this._cpu; }
    get registers(): CpuRegisters { return this.cpu.registers; }
    get totalCycles(): number { return this.cpu.processorCycles; }
    get isRunning(): boolean { return this._isRunning; }
    get cyclesPerSecond(): number { return this._cyclesPerSecond; }
    set cyclesPerSecond(cps: number) {
        this._cyclesPerSecond = cps;
        this.msPerCycle = 1000 / this._cyclesPerSecond;
        // Set the batch size such that each one will run ~10ms
        this.cyclesPerBatch = Math.floor(this._cyclesPerSecond / 100);
    }

    /**
     * @param cyclesPerSecond (optional) Processor speed, default is 1Mhz
     */
    constructor(cyclesPerSecond = DFLT_CYCLES_PER_SEC) {
        this.cyclesPerSecond = cyclesPerSecond;
        this.reset(true);
    }

    /** Sets the function to be called after every instruction is executed */
    public onStep(callback: (result: ExecutionResult) => any): Emulator {
        this.onStepCallback = callback;
        return this;
    }

    /** Sets the function to be called after every batch of instruction is executed */
    public onBatch(callback: (cycles: number) => any): Emulator {
        this.onBatchCallback = callback;
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

        this.ram.setBytes(bytes, startAddr);

        return this;
    }

    /**
     * Resets the emulator's cpu
     * @param hard (optional) If true memory is cleared
     */
    reset(hard = false): Emulator {
        if (this._isRunning) {
            throw new Error("Emulator must be stopped before calling reset");
        }

        this.cpu.resetCPU();
        if (hard) {
            this.ram.reset();
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
        this._isRunning = true;

        // Start async
        setTimeout(() => this.execBatch(), 0);

        return this;
    }

    /** Stops execution after the current instruction finishes */
    halt(): void {
        if (this._isRunning) {
            this.stopExec = true;
        }
    }

    /** Returns the dissassembly for the next instruction to be executed */
    getNextInstruction(): DisassembledInstruction {
        const inst = disassemble(this.ram.memory, 0, this.registers.pc, this.registers.pc + 1);
        return inst[0];
    }

    private execBatch(): void {
        let cycles = 0;
        let time = Date.now();

        do {
            const result = this.cpu.executeNext();
            if (this.onStepCallback) {
                this.onStepCallback(result);
            }
            
            if (result.isBreak && this.stopOnBreaK) {
                return this.fireOnStop("break");
            }

            cycles += result.cycles;
        }
        while (!this.stopExec && cycles < this.cyclesPerBatch);

        if (this.onBatchCallback) {
            this.onBatchCallback(cycles);
        }

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
        this._isRunning = false;
        if (this.onStopCallback) {
            this.onStopCallback(reason);
        }
    }
}