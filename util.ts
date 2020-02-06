import { DisassembledInstruction } from "./disassembler/dasm6502";

export function parseNumber(num: string): number
{
    if (num[0] === "$") {
        return parseInt(num.slice(1), 16);
    }
    else if (num[0] === "%") {
        return parseInt(num.slice(1), 2);
    }
    else {
        return parseInt(num, 10);
    }
}

export function isByte(num: number): boolean {
    return num >=0 && num <= 0xFF;
}

export function isSignedByte(num: number): boolean {
    return num >=-128 && num <= 127;
}

export function isWord(num: number): boolean {
    return num >=0 && num <= 0xFFFF;
}

/** Converts a word to two bytes in little endian */
export function wordToBytes(word: number): number[] {
    return [
        word & 0x00FF,
        (word & 0xFF00) >> 8
    ];
}

/** Converts a number to a signed byte in two's complement format */
export function toSignedByte(num: number): number {
    if (!isSignedByte(num)) {
        throw new Error("Value for a signed byte must be between -128 and 127");
    }

    if (num < 0) {
        // convert to 2's complement %11111111 = -1, %10000000 = -128
        num = 256 + num;
        //num = ((~Math.abs(num)) + 1) & 0xFF;
    }

    return num;
}

/** Converts from a signed byte in two's complement format to a number */
export function fromSignedByte(byte: number): number {
    if (!isByte(byte)) {
        throw new Error("Value for a byte must be between 0 and 255");
    }

    return (byte & 128) ? -((byte ^ 255) + 1) : byte;
}

/** Converts a number to a padded hex string using the specified number of bytes */
export function toHexString(num: number, byteCount = 1): string {
    const length = byteCount * 2;
    let hex = num.toString(16).toUpperCase();
    while (hex.length < length) {
        hex = "0" + hex;
    }
    return hex;
}

/** Converts an array of bytes to a string of hex codes separated by spaces */
export function byteArrayToHexString(bytes: number[], separator = " "): string {
    return bytes.map(n => toHexString(n)).join(separator)
}

/** Converts a string of hex codes separated by spaces to an array of bytes */
export function hexStringToByteArray(hex: string, separator = " "): number[] {
    return hex.split(separator).map(s => parseInt(s, 16) & 0xFF);
}

/** Parses a string of numbers separated by commas into an array of numbers  */
export function parseByteList(byteList: string): number[] {
    return byteList.split(",").map(n => parseNumber(n.trim()) & 0xFF);
}

/** Converts a DisassembledInstruction to a formatted string */
export function dasmToString(...dasm: DisassembledInstruction[]): string {
    return dasm.map(d => `${d.assembly} ${" ".repeat(12-d.assembly.length)} ; ${toHexString(d.address, 2)} ${byteArrayToHexString(d.bytes)}`)
            .join("\n");
}
