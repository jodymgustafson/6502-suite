export class RandomAccessMemory
{
    private _memory: number[] = [];
    get memory(): number[] { return this._memory;}

    constructor(private maxBytes = 0xFFFF) {
        // Make memory have a size by setting the last value
        this._memory[maxBytes] = 0;
    }

    reset(): void {
        //this._memory = [];
        this.memory.fill(0);
    }

    /** Gets the byte at the specified address */
    getByte(addr: number): number {
        return this._memory[addr & this.maxBytes] || 0;
    }

    /** Sets a byte at the specified location */
    setByte(byte: number, addr: number): RandomAccessMemory {
        this.memory[addr & this.maxBytes] = byte & 0xFF;
        return this;
    }

    /** Gets the word (2 bytes) at the specified address */
    getWord(addr: number): number {
        const lower = this.getByte(addr);
        const upper = this.getByte(addr + 1);
        return lower + (upper << 8);
    }

    /** Sets a word (2 bytes) at the specified location */
    setWord(word: number, addr: number): RandomAccessMemory {
        this.setByte(word, addr);
        return this.setByte(word >> 8, addr + 1);
    }

    /** Gets a number of contiguous bytes */
    getBytes(addr: number, count: number): number[] {
        //return this.memory.slice(addr, addr + count);
        const bytes = [];
        for (let i = 0; i < count; i++) {
            bytes.push(this.getByte(addr + i));
        }

        return bytes;
    }

    /** Sets a number of contiguous bytes */
    setBytes(bytes: number[], addr = 0): RandomAccessMemory {
        let pc = addr;
        for (const byte of bytes) {
            this.setByte(byte, pc++);
        }

        return this;
    }
}