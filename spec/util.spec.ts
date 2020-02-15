import { toSignedByte, wordToBytes, parseByteList, byteArrayToHexString, isWord, isByte, isSignedByte, fromSignedByte, hexStringToByteArray, getLSB, getMSB } from "../util";

describe("When check is word", () => {
    it("should be true", () => {
        expect(isWord(0x02F3)).toBeTrue();
        expect(isWord(0xFF)).toBeTrue();
        expect(isWord(0x0)).toBeTrue();
        expect(isWord(0xFFFF)).toBeTrue();
    });
    it("should be false", () => {
        expect(isWord(0xFFFF1)).toBeFalse();
        expect(isWord(-1)).toBeFalse();
    });
});

describe("When check is byte", () => {
    it("should be true", () => {
        expect(isByte(0x12)).toBeTrue();
        expect(isByte(0xFF)).toBeTrue();
        expect(isByte(0x0)).toBeTrue();
    });
    it("should be false", () => {
        expect(isByte(0xFF1)).toBeFalse();
        expect(isByte(-1)).toBeFalse();
    });
});

describe("When check is signed byte", () => {
    it("should be true", () => {
        expect(isSignedByte(0x12)).toBeTrue();
        expect(isSignedByte(127)).toBeTrue();
        expect(isSignedByte(0x0)).toBeTrue();
        expect(isSignedByte(-128)).toBeTrue();
    });
    it("should be false", () => {
        expect(isSignedByte(0xFF1)).toBeFalse();
        expect(isSignedByte(128)).toBeFalse();
        expect(isSignedByte(-129)).toBeFalse();
    });
});

describe("When word to bytes", () => {
    it("should convert word to bytes", () => {
        const result = wordToBytes(0x02F3);
        expect(result.length).toBe(2);
        expect(result[0]).toBe(0xF3);
        expect(result[1]).toBe(0x02);
    });
});

describe("When parse byte list", () => {
    it("should convert to bytes", () => {
        const result = parseByteList("$0A, 23,%1001, $3A,$4A");
        expect(result.length).toBe(5);
        expect(result[0]).toBe(0x0A);
        expect(result[1]).toBe(23);
        expect(result[2]).toBe(0b1001);
        expect(result[3]).toBe(0x3A);
        expect(result[4]).toBe(0x4A);
    });
});

describe("When convert to signed byte", () => {
    it("should convert 127 to signed byte", () => {
        const result = toSignedByte(127);
        expect(result).toBe(0b01111111);
    });
    it("should convert -1 to signed byte", () => {
        const result = toSignedByte(-1);
        expect(result).toBe(0b11111111);
    });
    it("should convert -127 to signed byte", () => {
        const result = toSignedByte(-127);
        expect(result).toBe(0b10000001);
    });
    it("should convert -128 to signed byte", () => {
        const result = toSignedByte(-128);
        expect(result).toBe(0b10000000);
    });
});

describe("When convert from signed byte", () => {
    it("should convert signed byte to 127", () => {
        const result = fromSignedByte(0b01111111);
        expect(result).toBe(127);
    });
    it("should convert signed byte to -1", () => {
        const result = fromSignedByte(0b11111111);
        expect(result).toBe(-1);
    });
    it("should convert signed byte to -127", () => {
        const result = fromSignedByte(0b10000001);
        expect(result).toBe(-127);
    });
    it("should convert signed byte to -128", () => {
        const result = fromSignedByte(0b10000000);
        expect(result).toBe(-128);
    });
});

describe("When convert byte array to string", () => {
    it("should convert array to string", () => {
        const result = byteArrayToHexString([0xA9, 0x01, 0x8D, 0x00, 0x02, 0xA9, 0x05, 0x8D, 0x01, 0x02, 0xA9, 0x08, 0x8D, 0x02, 0x02]);
        expect(result).toBe("A9 01 8D 00 02 A9 05 8D 01 02 A9 08 8D 02 02");
    });
});

describe("When convert hex string to byte array", () => {
    it("should convert string to array", () => {
        const result = hexStringToByteArray("A9 01 8D 00 02 A9 05 8D 01 02 A9 08 8D 02 02");
        expect(result).toEqual([0xA9, 0x01, 0x8D, 0x00, 0x02, 0xA9, 0x05, 0x8D, 0x01, 0x02, 0xA9, 0x08, 0x8D, 0x02, 0x02]);
    });
});

describe("When convert string to byte list", () => {
    it("should convert string to array of bytes", () => {
        const result = parseByteList("$A9, %01, $8D, 2");
        expect(result).toEqual([0xA9, 0x01, 0x8D, 0x02]);
    });
});

describe("When get LSB", () => {
    it("should get lower byte of a word", () => {
        const result = getLSB(0xA9F3);
        expect(result).toEqual(0xF3);
    });
});

describe("When get MSB", () => {
    it("should get upper byte of a word", () => {
        const result = getMSB(0xA9F3);
        expect(result).toEqual(0xA9);
    });
});