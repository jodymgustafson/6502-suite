import { parseNumber, wordToBytes, toSignedByte, isSignedByte, parseByteList } from "../util";
import { OPCODES, OpCodeIndex } from "./opcodes";
import * as addressing from "./addressing";
import { AddressingInfo } from "./addressing";

export type MetaInstruction = {
    operation: string,
    operand: string,
    /** address of the next byte after this operation */
    address: number,
    /** number of bytes for the operation */
    byteCount: number,
    /** operation code */
    opCode?: number,
    /** value of the operand */
    opValue?: number,
    /** set if operation references a label */
    opLabel?: string,
    /** any other data */
    data?: any
}

/**
 * Assembles 6502 code into bytes
 * @param code Lines of assembly code
 * @param baseAddr (optional) Address the code will start at
 */
export function assemble(code: string, baseAddr = 0): number[]
{
    // First pass parses code into operations
    const instructions: MetaInstruction[] = parseLines(code.split("\n"), baseAddr);
    //console.log(lines);

    // Second pass resolves labels and parses operations into bytes
    const bytes: number[] = parseInstructions(instructions);

    return bytes;
}

/**
 * Resolves labels and parses operations into bytes
 * @param instructions 
 */
function parseInstructions(instructions: MetaInstruction[]) {
    const bytes: number[] = [];
    for (const i of instructions) {
        if (i.opCode !== undefined) {
            bytes.push(...getInstructionBytes(i, instructions));
        }
        else if (isDCB(i)) {
            bytes.push(...i.data as number[]);
        }
        else if (isLabel(i)) {
            // nothing
        }
        else if (isSetAddress(i)) {
            // nothing
        }
        else {
            throw new Error("Invalid instruction: " + JSON.stringify(i));
        }
    }

    return bytes;
}

function getInstructionBytes(instr: MetaInstruction,  instructions: MetaInstruction[]): number[] {
    const bytes = [];

    if (instr.opLabel) {
        // turn the label into an address
        instr.opValue = resolveLabel(instr, instructions);
    }

    // Get the op code byte
    bytes.push(instr.opCode);

    // Get the op value bytes
    if (instr.byteCount === 3) {
        bytes.push(...wordToBytes(instr.opValue));
    }
    else if (instr.byteCount === 2) {
        bytes.push(instr.opValue);
    }

    return bytes;
}

function resolveLabel(instr: MetaInstruction, lines: MetaInstruction[]): number
{
    const label = instr.opLabel;
    const foundLabel = lines.find(l => l.operation === "LABEL" && l.opLabel === label);
    if (foundLabel) {
        if (instr.byteCount === 2) {
            // branch, compute offset as signed byte
            return getAddressOffset(instr.address, foundLabel.address);
        }
        else {
            // jump
            return foundLabel.address;
        }
    }
    throw new Error("Invalid label: " + label);
}

/**
 * Compute offset between two addressed as a signed byte
 * @param from From address
 * @param to To address
 */
function getAddressOffset(from: number, to: number): number {
    // 
    const offset = to - from;
    if (!isSignedByte(offset)) {
        throw new Error("Label must be within 127 bytes: " + offset);
    }
    return toSignedByte(offset);
}

function parseLines(lines: string[], baseAddr: number): MetaInstruction[]
{
    const instructions: MetaInstruction[] = [];
    const defines = {};
    let addr = baseAddr;

    for (let line of lines) {
        line = removeComments(line);

        // if it's a label and there's code after the label, split into 2 lines
        const labelEnd = line.indexOf(":");
        if (labelEnd >= 0 && labelEnd < line.length) {
            // parse the label and add it
            instructions.push(parseLine(line.slice(0, labelEnd + 1).trim(), addr, defines));
            // get the code after the label
            line = line.slice(labelEnd + 1);
        }

        line = line.trim().toUpperCase();
        if (line) {
            const parsed = parseLine(line, addr, defines);
            if (isSetAddress(parsed)) {
                addr = parsed.address;
            }
            if (!isDefine(parsed)) {
                instructions.push(parsed);
                addr = parsed.address;
            }
        }
    };

    return instructions;
}

function removeComments(line: string) {
    const commentStart = line.indexOf(";");
    if (commentStart > 0) {
        line = line.slice(0, commentStart);
    }
    return line;
}

function parseLine(line: string, addr: number, defines: any): MetaInstruction
{
    //console.log(line);
    if (line.startsWith("*=")) {
        return parseBase(line);
    }

    // format: operation [operand]
    const tokens = /^(\S+)\s*(.+)?$/.exec(line).slice(1, 3);

    //console.log(tokens);
    const instr: MetaInstruction = {
        operation: tokens[0],
        operand: tokens[1],
        address: addr,
        byteCount: 0
    };

    if (isDCB(instr)) {
        instr.data = parseDCBToBytes(instr.operand);
        instr.byteCount = instr.data.length;
    }
    else if (isLabel(instr)) {
        // Remove the colon
        instr.opLabel = instr.operation.slice(0, -1).toUpperCase();
        instr.operation = "LABEL";
    }
    else if (isDefine(instr)) {
        // Operand format: [name value]
        const tuple = instr.operand.split(/\s/);
        defines[tuple[0]] = tuple[1];
        return instr;
    }
    else {
        if (instr.operand) {
            instr.operand = replaceDefines(instr.operand, defines);
        }
        setOpCode(instr);
    }

    instr.address += instr.byteCount;

    return instr;
}

function isDirective(instr: MetaInstruction): boolean {
    return isLabel(instr) || isDCB(instr) || isDefine(instr) || isSetAddress(instr);    
}
function isLabel(instr: MetaInstruction): boolean {
    return instr.operation.endsWith(":") || instr.operation === "LABEL";
}
function isDCB(instr: MetaInstruction): boolean {
    return instr.operation === "DCB";
}
function isDefine(instr: MetaInstruction): boolean {
    return instr.operation === "DEFINE" || instr.operation === "DEF";
}
function isSetAddress(instr: MetaInstruction): boolean {
    return instr.operation === "*=";
}

/** 
 * Looks for constants and replaces them with the value
 * @param operand The operand to search
 * @param defines A map of names to values
 */
function replaceDefines(operand: string, defines: any): string {
    for (const name in defines) {
        const value: string = defines[name];
        const idx = operand.indexOf(name);
        if (idx >= 0) {
            return operand.replace(name, value);
        }
    }

    return operand;
}

function setOpCode(instr: MetaInstruction): void
{
    const opCodeGroup = getOpCodeGroup(instr.operation);
    
    let info: AddressingInfo;
    if (info = addressing.checkNonAddress(instr.operand)) {
        instr.opCode = opCodeGroup[OpCodeIndex.SNGL];
        instr.byteCount = 1;
    }
    else if (opCodeGroup[OpCodeIndex.BRA] && (info = addressing.checkBranch(instr.operand))) {
        if (typeof info.value === "string") {
            instr.opLabel = info.value as string;
        }
        else {
            instr.opValue = getAddressOffset(instr.address, info.value);
        }
        instr.opCode = opCodeGroup[OpCodeIndex.BRA];
        instr.byteCount = 2;
    }
    else if (info = addressing.checkImmediate(instr.operand)) {
        instr.opValue = info.value as number;
        instr.opCode = opCodeGroup[OpCodeIndex.IMM];
        instr.byteCount = 2;
    }
    else if (info = addressing.checkZeroPage(instr.operand)) {
        instr.opValue = info.value as number;
        instr.opCode = opCodeGroup[info.register === "X" ? OpCodeIndex.ZPX : info.register === "Y" ? OpCodeIndex.ZPY : OpCodeIndex.ZP];
        instr.byteCount = 2;
    }
    else if (info = addressing.checkAbsolute(instr.operand)) {
        if (typeof info.value === "string") {
            instr.opLabel = info.value as string;
        }
        else {
            instr.opValue = info.value as number;
        }
        instr.opCode = opCodeGroup[info.register === "X" ? OpCodeIndex.ABSX : info.register === "Y" ? OpCodeIndex.ABSY : OpCodeIndex.ABS];
        instr.byteCount = 3;
    }
    else if (info = addressing.checkIndirect(instr.operand)) {
        instr.opValue = info.value as number;
        instr.opCode = opCodeGroup[info.register === "X" ? OpCodeIndex.INDX : info.register === "Y" ? OpCodeIndex.INDY : OpCodeIndex.IND];
        instr.byteCount = (info.register === "X" || info.register === "Y") ? 2 : 3;
    }
    else {
        throw new Error("Unhandled operation: " + JSON.stringify(instr));
    }

    if (instr.opCode === null) {
        throw new Error("Error setting opCode: " + JSON.stringify(instr));
    }
}

function getOpCodeGroup(operation: string): number[]
{
    const opCodeGroup = OPCODES[operation] as number[];
    if (opCodeGroup) {
        return opCodeGroup;
    }

    throw new Error("Invalid operation: " + operation);
}

function parseBase(line: string): MetaInstruction
{
    // get the value after *=, that will be the new address
    const base = line.slice(2).trim();
    //console.log("base", base);
    return {
        operation: "*=",
        operand: base,
        address: parseNumber(base),
        byteCount: 0
    };
}

function parseDCBToBytes(operand: string): number[] {
    const bytes = [];

    const tokens = operand.split(",");
    for (let token of tokens) {
        token = token.trim();
        // Check if it's a string
        const match = /['"]{1}(.+)['"]{1}/.exec(token);
        if (match) {
            // Convert string to bytes
            bytes.push(...match[1].split("").map(c => c.charCodeAt(0)));
        }
        else {
            bytes.push(parseNumber(token.trim()) & 0xFF);
        }
    }
    return bytes;
}
