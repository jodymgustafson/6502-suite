/*
	6502 CPU Emulator
	by JM Gustafson, 2020 worldtreesoftware.com

	Derived from the JavaScript source by

	6502 JavaScript emulator
	by N. Landsteiner  2005, e-tradion.net / masswerk.at
	
		derived from the c source by
		
		Earle F. Philhower III, Commodore 64 Emulator v0.3, (C) 1993-4
		
		extended for exact cycle times [N. Landsteiner, 2005]

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    For the GNU General Public License see the Free Software Foundation,
    Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
    
    Thanks to "chip" for a bugfix in function BranchRelAddr().
    
    fixed a bug regarding byte ranges in functions opDECR and opINCR -
    thanks to James Larson for reporting. (2008-09-05)
    
    fixed V-flag according to http://www.6502.org/tutorials/vflag.html (2016)
    reimplemented BCD arithmetics, also some more shared code for immediate
    addressing (2016)
*/

// constants

/** The indirect address where execution will jump to on a break operation */
export const IrqTo = 0xfffe;

const fCAR = 1;
const fZER = 2;
const fINT = 4;
const fDEC = 8;
const fBKC = 16;
const fOVF = 64;
const fNEG = 128;

const CYCLE_TIME = [
	7, 6, 0, 0, 0, 3, 5, 0, 3, 2, 2, 0, 0, 4, 6, 0,  // 00
	2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0,  // 10
	6, 6, 0, 0, 3, 3, 5, 0, 4, 2, 2, 0, 4, 4, 6, 0,  // 20
	2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0,  // 30
	6, 6, 0, 0, 0, 3, 5, 0, 3, 2, 2, 0, 3, 4, 6, 0,  // 40
	2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0,  // 50
	6, 6, 0, 0, 0, 3, 5, 0, 4, 2, 2, 0, 5, 4, 6, 0,  // 60
	2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0,  // 70
	0, 6, 0, 0, 3, 3, 3, 0, 2, 0, 2, 0, 4, 4, 4, 0,  // 80
	2, 6, 0, 0, 4, 4, 4, 0, 2, 5, 2, 0, 0, 5, 0, 0,  // 90
	2, 6, 2, 0, 3, 3, 3, 0, 2, 2, 2, 0, 4, 4, 4, 0,  // A0
	2, 5, 0, 0, 4, 4, 4, 0, 2, 4, 2, 0, 4, 4, 4, 0,  // B0
	2, 6, 0, 0, 3, 3, 5, 0, 2, 2, 2, 0, 4, 4, 3, 0,  // C0
	2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0,  // D0
	2, 6, 0, 0, 3, 3, 5, 0, 2, 2, 2, 0, 4, 4, 6, 0,  // E0
	2, 5, 0, 0, 0, 4, 6, 0, 2, 4, 0, 0, 0, 4, 7, 0   // F0
];
const EXTRA_CYCLES = [
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 00
	2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0,  // 10
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 20
	2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0,  // 30
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 40
	2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0,  // 50
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 60
	2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0,  // 70
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 80
	2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 90
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // A0
	2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0,  // B0
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // C0
	2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0,  // D0
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // E0
	2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0   // F0
];

/**
 * Factory function to create an instance of a 6502 CPU emulator.
 * Returns an object with the following properties:
 * state
 */
export const Cpu6502 = function() {
	let debug = false;
	/** Will be true upon a break instruction */
	let breakFlag = false;
	
	// regs & memory

	let a: number;
	let x: number;
	let y: number;
	let flags: number;
	let sp: number;
	let pc: number;
	let RAM: number[] = [];
	let excycles: number;
	let addcycles: number;

	function ByteAt(addr: number): number {
		return RAM[addr] || 0;
	}
	function WordAt(addr: number): number {
		return ByteAt(addr) + ByteAt(0xffff & (addr + 1)) * 256;
	}
	function ImmediateByte(): number {
		return ByteAt(pc);
	}
	function ImmediateAddr(): number {
		return pc;
	}
	function ZeroPageAddr(): number {
		return ByteAt(pc);
	}
	function ZeroPageXAddr(): number {
		return 255 & (x + ByteAt(pc));
	}
	function ZeroPageYAddr(): number {
		return 255 & (y + ByteAt(pc));
	}
	function IndirectXAddr(): number {
		return WordAt(255 & (ByteAt(pc) + x));
	}
	function IndirectYAddr(): number {
		if (addcycles) {
			let a1 = WordAt(ByteAt(pc));
			let a2 = (a1 + y) & 0xffff;
			if ((a1 & 0xff00) != (a2 & 0xff00)) excycles++;
			return a2;
		}
		else {
			return (WordAt(ByteAt(pc)) + y) & 0xffff;
		}
	}
	function AbsoluteAddr(): number {
		return WordAt(pc);
	}
	function AbsoluteXAddr(): number {
		if (addcycles) {
			let a1 = WordAt(pc);
			let a2 = (a1 + x) & 0xffff;
			if ((a1 & 0xff00) != (a2 & 0xff00)) excycles++;
			return a2;
		}
		else {
			return (WordAt(pc) + x) & 0xffff;
		}
	}
	function AbsoluteYAddr(): number {
		if (addcycles) {
			let a1 = WordAt(pc);
			let a2 = (a1 + y) & 0xffff;
			if ((a1 & 0xff00) != (a2 & 0xff00)) excycles++;
			return a2;
		}
		else {
			return (WordAt(pc) + y) & 0xffff;
		}
	}
	function BranchRelAddr() {
		excycles++;
		let addr = ImmediateByte()
		pc++;
		addr = (addr & 128) ? pc - ((addr ^ 255) + 1) : pc + addr;
		if ((pc & 0xff00) != (addr & 0xff00)) excycles++;
		pc = addr & 0xffff;
	}

	// stack

	function stPush(z: number) {
		RAM[sp + 256] = z & 255;
		sp--;
		sp &= 255;
	}
	function stPop(): number {
		sp++;
		sp &= 255;
		return ByteAt(sp + 256);
	}
	function stPushWord(z: number) {
		stPush((z >> 8) & 255);
		stPush(z & 255);
	}
	function stPopWord(): number {
		let z = stPop();
		z += 256 * stPop();
		return z;
	}

	// operations

	function FlagsNZ(z: number) {
		flags &= ~(fZER + fNEG);
		if (z == 0) {
			flags |= fZER;
		}
		else {
			flags |= z & 128;
		}
	}
	function opORA(x: () => number) {
		a |= ByteAt(x());
		FlagsNZ(a);
	}
	function opASL(x: () => number) {
		let addr = x();
		let tbyte = ByteAt(addr);
		flags &= ~(fCAR + fNEG + fZER);
		if (tbyte & 128) flags |= fCAR;
		if (tbyte = tbyte << 1) {
			flags |= tbyte & 128;
		}
		else {
			flags |= fZER;
		}
		RAM[addr] = tbyte
	}
	function opLSR(x: () => number) {
		let addr = x();
		let tbyte = ByteAt(addr);
		flags &= ~(fCAR + fNEG + fZER);
		flags |= tbyte & 1;
		if (tbyte = tbyte >> 1) { }
		else {
			flags |= fZER;
		}
		RAM[addr] = tbyte;
	}
	function opBCL(x: number) {
		if (flags & x) {
			pc++;
		}
		else {
			BranchRelAddr();
		}
	}
	function opBST(x: number) {
		if (flags & x) {
			BranchRelAddr();
		}
		else {
			pc++;
		}
	}
	function opCLR(x: number) {
		flags &= ~x;
	}
	function opSET(x: number) {
		flags |= x;
	}
	function opAND(x: () => number) {
		a &= ByteAt(x());
		FlagsNZ(a);
	}
	function opBIT(x: () => number) {
		let tbyte = ByteAt(x());
		flags &= ~(fZER + fNEG + fOVF);
		if ((a & tbyte) == 0) flags |= fZER;
		flags |= tbyte & (128 + 64);
	}
	function opROL(x: () => number) {
		let addr = x();
		let tbyte = ByteAt(addr);
		if (flags & fCAR) {
			if (tbyte & 128) { }
			else {
				flags &= ~fCAR;
			}
			tbyte = (tbyte << 1) | 1;
		}
		else {
			if (tbyte & 128) flags |= fCAR;
			tbyte = tbyte << 1;
		}
		FlagsNZ(tbyte);
		RAM[addr] = tbyte;
	}
	function opEOR(x: () => number) {
		a ^= ByteAt(x());
		FlagsNZ(a);
	}
	function opADC(x: () => number) {
		let data = ByteAt(x());
		if (flags & fDEC) {
			let h, c = 0,
				l = (a & 15) + (data & 15) + ((flags & fCAR) ? 1 : 0),
				h1 = (a >> 4) & 15,
				h2 = (data >> 4) & 15,
				s1 = (h1 & 8) ? h1 - 16 : h1,
				s2 = (h2 & 8) ? h2 - 16 : h2,
				s = s1 + s2;
			flags &= ~(fCAR + fOVF + fNEG + fZER);
			if (l > 9) {
				l = (l + 6) & 15;
				c = 1;
			}
			h = h1 + h2 + c;
			if (h > 9) {
				h = (h + 6) & 15;
				flags |= fCAR;
			}
			a = (h << 4) | l;
			if (a == 0) {
				flags |= fZER;
			}
			else if (a & 128) {
				flags |= fNEG;
			}
			if (s < -8 || s > 7) flags |= fOVF;
		}
		else {
			let r = data + a + ((flags & fCAR) ? 1 : 0);
			flags &= ~(fCAR + fOVF + fNEG + fZER);
			if (r > 255) {
				flags |= fCAR;
				r &= 255;
			}
			if (r == 0) {
				flags |= fZER;
			}
			else {
				flags |= r & 128;
			}
			if ((a ^ r) & (data ^ r) & 128) flags |= fOVF;
			a = r;
		}
	}
	function opROR(x: () => number) {
		let addr = x();
		let tbyte = ByteAt(addr);
		if (flags & fCAR) {
			if (tbyte & 1) { }
			else flags &= ~fCAR;
			tbyte = (tbyte >> 1) | 128;
		}
		else {
			if (tbyte & 1) flags |= fCAR;
			tbyte = tbyte >> 1;
		};
		FlagsNZ(tbyte);
		RAM[addr] = tbyte;
	}
	function opSTA(x: () => number) {
		RAM[x()] = a;
	}
	function opSTY(x: () => number) {
		RAM[x()] = y;
	}
	function opSTX(y: () => number) {
		RAM[y()] = x;
	}
	function opCPY(x: () => number) {
		let tbyte = ByteAt(x());
		flags &= ~(fCAR + fZER + fNEG);
		if (y == tbyte) {
			flags |= fCAR + fZER;
		}
		else if (y > tbyte) {
			flags |= fCAR;
		}
		else {
			flags |= fNEG;
		}
	}
	function opCPX(y: () => number) {
		let tbyte = ByteAt(y());
		flags &= ~(fCAR + fZER + fNEG);
		if (x == tbyte) {
			flags |= fCAR + fZER;
		}
		else if (x > tbyte) {
			flags |= fCAR;
		}
		else {
			flags |= fNEG;
		}
	}
	function opCMP(x: () => number) {
		let tbyte = ByteAt(x());
		flags &= ~(fCAR + fZER + fNEG);
		if (a == tbyte) {
			flags |= fCAR + fZER;
		}
		else if (a > tbyte) {
			flags |= fCAR;
		}
		else {
			flags |= fNEG;
		}
	}
	function opSBC(x: () => number) {
		let data = ByteAt(x()), r = a - data - ((flags & fCAR) ? 0 : 1), rb = r & 255;
		if (flags & fDEC) {
			let h, c = 0,
				l = (a & 15) - (data & 15) - ((flags & fCAR) ? 1 : 0),
				h1 = (a >> 4) & 15,
				h2 = (data >> 4) & 15;
			flags &= ~(fCAR + fZER + fOVF + fNEG);
			if (l < 0) {
				l += 10;
				c = 1;
			}
			else if (l > 9) {
				l = (l + 6) & 15;
			}
			h = h1 - h2 - c;
			if (h < 0) {
				h += 10;
				flags |= fCAR;
			}
			else if (h > 9) {
				h = (h + 6) & 15;
			}
			r = (h << 4) | l;
			if (r == 0) {
				flags |= fZER + fCAR;
			}
			else {
				flags |= fCAR;
			}
			if (r & 128) flags |= fNEG;
		}
		else {
			flags &= ~(fCAR + fZER + fOVF + fNEG);
			if (r == 0) {
				flags |= fZER + fCAR;
			}
			else if (r > 0) {
				flags |= fCAR;
			}
			flags |= r & 128;
			r &= 255;
		}
		if ((a ^ rb) & ((255 - data) ^ rb) & 128) flags |= fOVF;
		a = r;
	}
	function opDECR(x: () => number) {
		let addr = x();
		let tbyte = (ByteAt(addr) - 1) & 255;
		flags &= ~(fZER + fNEG);
		if (tbyte) {
			flags |= tbyte & 128;
		}
		else {
			flags |= fZER;
		}
		RAM[addr] = tbyte;
	}
	function opINCR(x: () => number) {
		let addr = x();
		let tbyte = (ByteAt(addr) + 1) & 255;
		flags &= ~(fZER + fNEG);
		if (tbyte) {
			flags |= tbyte & 128;
		}
		else {
			flags |= fZER;
		}
		RAM[addr] = tbyte;
	}
	function opLDA(x: () => number) {
		a = ByteAt(x());
		FlagsNZ(a);
	}
	function opLDY(x: () => number) {
		y = ByteAt(x());
		FlagsNZ(y);
	}
	function opLDX(y: () => number) {
		x = ByteAt(y());
		FlagsNZ(x);
	}


	// instructions

	/* original i00
	function i00() {
		stPushWord(pc);
		flags |= fBKC;
		stPush(flags);
		flags &= ~fBKC;
		pc=WordAt(IrqTo);
		breakFlag=true;
	}
	*/
	function i00() {
		flags |= fBKC;
		stPushWord(pc);
		stPush(flags);
		flags |= fINT;
		pc = WordAt(IrqTo);
		breakFlag = true;
	}
	function i01() { opORA(IndirectXAddr); pc++; }
	function i05() { opORA(ZeroPageAddr); pc++; }
	function i06() { opASL(ZeroPageAddr); pc++; }
	function i08() { stPush(flags); }
	function i09() { a |= ImmediateByte(); FlagsNZ(a); pc++; }
	function i0a() {
		if (a & 128) {
			flags |= fCAR;
		}
		else {
			flags &= ~fCAR;
		}
		a = a << 1;
		FlagsNZ(a);
		a &= 255;
	}
	function i0d() { opORA(AbsoluteAddr); pc += 2; }
	function i0e() { opASL(AbsoluteAddr); pc += 2; }
	function i10() { opBCL(fNEG); }
	function i11() { opORA(IndirectYAddr); pc++; }
	function i15() { opORA(ZeroPageXAddr); pc++; }
	function i16() { opASL(ZeroPageXAddr); pc++; }
	function i18() { opCLR(fCAR); }
	function i19() { opORA(AbsoluteYAddr); pc += 2; }
	function i1d() { opORA(AbsoluteXAddr); pc += 2; }
	function i1e() { opASL(AbsoluteXAddr); pc += 2; }
	function i20() { stPushWord((pc + 1) & 0xffff); pc = WordAt(pc); }
	function i21() { opAND(IndirectXAddr); pc++; }
	function i24() { opBIT(ZeroPageAddr); pc++; }
	function i25() { opAND(ZeroPageAddr); pc++; }
	function i26() { opROL(ZeroPageAddr); pc++; }
	function i28() { flags = stPop(); }
	function i29() { a &= ImmediateByte(); FlagsNZ(a); pc++; }
	function i2a() {
		if (flags & fCAR) {
			if ((a & 128) == 0) flags &= ~fCAR;
			a = (a << 1) | 1;
		}
		else {
			if (a & 128) flags |= fCAR;
			a = a << 1;
		};
		FlagsNZ(a);
		a &= 255;
	}
	function i2c() { opBIT(AbsoluteAddr); pc += 2; }
	function i2d() { opAND(AbsoluteAddr); pc += 2; }
	function i2e() { opROL(AbsoluteAddr); pc += 2; }
	function i30() { opBST(fNEG); }
	function i31() { opAND(IndirectYAddr); pc++; }
	function i35() { opAND(ZeroPageXAddr); pc++; }
	function i36() { opROL(ZeroPageXAddr); pc++; }
	function i38() { opSET(fCAR); }
	function i39() { opAND(AbsoluteYAddr); pc += 2; }
	function i3d() { opAND(AbsoluteXAddr); pc += 2; }
	function i3e() { opROL(AbsoluteXAddr); pc += 2; }
	function i40() { flags = stPop(); pc = stPopWord(); }
	function i41() { opEOR(IndirectXAddr); pc++; }
	function i45() { opEOR(ZeroPageAddr); pc++; }
	function i46() { opLSR(ZeroPageAddr); pc++; }
	function i48() { stPush(a); }
	function i49() { a ^= ImmediateByte(); FlagsNZ(a); pc++; }
	function i4a() {
		flags &= ~(fCAR + fNEG + fZER);
		if (a & 1) flags |= fCAR;
		if (a = a >> 1) { }
		else {
			flags |= fZER;
		}
		a &= 255;
	}
	function i4c() { pc = WordAt(pc); }
	function i4d() { opEOR(AbsoluteAddr); pc += 2; }
	function i4e() { opLSR(AbsoluteAddr); pc += 2; }
	function i50() { opBCL(fOVF); }
	function i51() { opEOR(IndirectYAddr); pc++; }
	function i55() { opEOR(ZeroPageXAddr); pc++; }
	function i56() { opLSR(ZeroPageXAddr); pc++; }
	function i58() { opCLR(fINT); }
	function i59() { opEOR(AbsoluteYAddr); pc += 2; }
	function i5d() { opEOR(AbsoluteXAddr); pc += 2; }
	function i5e() { opLSR(AbsoluteXAddr); pc += 2; }
	function i60() { pc = stPopWord(); pc++; }
	function i61() { opADC(IndirectXAddr); pc++; }
	function i65() { opADC(ZeroPageAddr); pc++; }
	function i66() { opROR(ZeroPageAddr); pc++; }
	function i68() { a = stPop(); FlagsNZ(a); }
	function i69() { opADC(ImmediateAddr); pc++; }
	function i6a() {
		if (flags & fCAR) {
			if ((a & 1) == 0) flags &= ~fCAR;
			a = (a >> 1) | 128;
		}
		else {
			if (a & 1) flags |= fCAR;
			a = a >> 1;
		}
		FlagsNZ(a);
		a &= 255;
	}
	function i6c() {
		let ta = WordAt(pc);
		pc = WordAt(ta);
	}
	function i6d() { opADC(AbsoluteAddr); pc += 2; }
	function i6e() { opROR(AbsoluteAddr); pc += 2; }
	function i70() { opBST(fOVF); }
	function i71() { opADC(IndirectYAddr); pc++; }
	function i75() { opADC(ZeroPageXAddr); pc++; }
	function i76() { opROR(ZeroPageXAddr); pc++; }
	function i78() { opSET(fINT); }
	function i79() { opADC(AbsoluteYAddr); pc += 2; }
	function i7d() { opADC(AbsoluteXAddr); pc += 2; }
	function i7e() { opROR(AbsoluteXAddr); pc += 2; }
	function i81() { opSTA(IndirectXAddr); pc++; }
	function i84() { opSTY(ZeroPageAddr); pc++; }
	function i85() { opSTA(ZeroPageAddr); pc++; }
	function i86() { opSTX(ZeroPageAddr); pc++; }
	function i88() { y--; y &= 255; FlagsNZ(y); }
	function i8a() { a = x; FlagsNZ(a); }
	function i8c() { opSTY(AbsoluteAddr); pc += 2; }
	function i8d() { opSTA(AbsoluteAddr); pc += 2; }
	function i8e() { opSTX(AbsoluteAddr); pc += 2; }
	function i90() { opBCL(fCAR); }
	function i91() { opSTA(IndirectYAddr); pc++; }
	function i94() { opSTY(ZeroPageXAddr); pc++; }
	function i95() { opSTA(ZeroPageXAddr); pc++; }
	function i96() { opSTX(ZeroPageYAddr); pc++; }
	function i98() { a = y; FlagsNZ(a); }
	function i99() { opSTA(AbsoluteYAddr); pc += 2; }
	function i9a() { sp = x; }
	function i9d() { opSTA(AbsoluteXAddr); pc += 2; }
	function ia0() { y = ImmediateByte(); FlagsNZ(y); pc++; }
	function ia1() { opLDA(IndirectXAddr); pc++; }
	function ia2() { x = ImmediateByte(); FlagsNZ(x); pc++; }
	function ia4() { opLDY(ZeroPageAddr); pc++; }
	function ia5() { opLDA(ZeroPageAddr); pc++; }
	function ia6() { opLDX(ZeroPageAddr); pc++; }
	function ia8() { y = a; FlagsNZ(y); }
	function ia9() { a = ImmediateByte(); FlagsNZ(a); pc++; }
	function iaa() { x = a; FlagsNZ(x); }
	function iac() { opLDY(AbsoluteAddr); pc += 2; }
	function iad() { opLDA(AbsoluteAddr); pc += 2; }
	function iae() { opLDX(AbsoluteAddr); pc += 2; }
	function ib0() { opBST(fCAR); }
	function ib1() { opLDA(IndirectYAddr); pc++; }
	function ib4() { opLDY(ZeroPageXAddr); pc++; }
	function ib5() { opLDA(ZeroPageXAddr); pc++; }
	function ib6() { opLDX(ZeroPageYAddr); pc++; }
	function ib8() { opCLR(fOVF); }
	function ib9() { opLDA(AbsoluteYAddr); pc += 2; }
	function iba() { x = sp; }
	function ibc() { opLDY(AbsoluteXAddr); pc += 2; }
	function ibd() { opLDA(AbsoluteXAddr); pc += 2; }
	function ibe() { opLDX(AbsoluteYAddr); pc += 2; }
	function ic0() { opCPY(ImmediateAddr); pc++; }
	function ic1() { opCMP(IndirectXAddr); pc++; }
	function ic4() { opCPY(ZeroPageAddr); pc++; }
	function ic5() { opCMP(ZeroPageAddr); pc++; }
	function ic6() { opDECR(ZeroPageAddr); pc++; }
	function ic8() { y++; y &= 255; FlagsNZ(y); }
	function ic9() { opCMP(ImmediateAddr); pc++; }
	function ica() { x--; x &= 255; FlagsNZ(x); }
	function icc() { opCPY(AbsoluteAddr); pc += 2; }
	function icd() { opCMP(AbsoluteAddr); pc += 2; }
	function ice() { opDECR(AbsoluteAddr); pc += 2; }
	function id0() { opBCL(fZER); }
	function id1() { opCMP(IndirectYAddr); pc++; }
	function id5() { opCMP(ZeroPageXAddr); pc++; }
	function id6() { opDECR(ZeroPageXAddr); pc++; }
	function id8() { opCLR(fDEC); }
	function id9() { opCMP(AbsoluteYAddr); pc += 2; }
	function idd() { opCMP(AbsoluteXAddr); pc += 2; }
	function ide() { opDECR(AbsoluteXAddr); pc += 2; }
	function ie0() { opCPX(ImmediateAddr); pc++; }
	function ie1() { opSBC(IndirectXAddr); pc++; }
	function ie4() { opCPX(ZeroPageAddr); pc++; }
	function ie5() { opSBC(ZeroPageAddr); pc++; }
	function ie6() { opINCR(ZeroPageAddr); pc++; }
	function ie8() { x++; x &= 255; FlagsNZ(x); }
	function ie9() { opSBC(ImmediateAddr); pc++; }
	function iea() { }
	function iec() { opCPX(AbsoluteAddr); pc += 2; }
	function ied() { opSBC(AbsoluteAddr); pc += 2; }
	function iee() { opINCR(AbsoluteAddr); pc += 2; }
	function if0() { opBST(fZER); }
	function if1() { opSBC(IndirectYAddr); pc++; }
	function if5() { opSBC(ZeroPageXAddr); pc++; }
	function if6() { opINCR(ZeroPageXAddr); pc++; }
	function if8() { opSET(fDEC); }
	function if9() { opSBC(AbsoluteYAddr); pc += 2; }
	function ifd() { opSBC(AbsoluteXAddr); pc += 2; }
	function ife() { opINCR(AbsoluteXAddr); pc += 2; }

	function ini() {
		if (debug) alert('Not implemented');
		pc++;
	}

	// code pages

	const INSTRUCTION2FN = [
		i00, i01, ini, ini, ini, i05, i06, ini,
		i08, i09, i0a, ini, ini, i0d, i0e, ini,
		i10, i11, ini, ini, ini, i15, i16, ini,
		i18, i19, ini, ini, ini, i1d, i1e, ini,
		i20, i21, ini, ini, i24, i25, i26, ini,
		i28, i29, i2a, ini, i2c, i2d, i2e, ini,
		i30, i31, ini, ini, ini, i35, i36, ini,
		i38, i39, ini, ini, ini, i3d, i3e, ini,
		i40, i41, ini, ini, ini, i45, i46, ini,
		i48, i49, i4a, ini, i4c, i4d, i4e, ini,
		i50, i51, ini, ini, ini, i55, i56, ini,
		i58, i59, ini, ini, ini, i5d, i5e, ini,
		i60, i61, ini, ini, ini, i65, i66, ini,
		i68, i69, i6a, ini, i6c, i6d, i6e, ini,
		i70, i71, ini, ini, ini, i75, i76, ini,
		i78, i79, ini, ini, ini, i7d, i7e, ini,
		ini, i81, ini, ini, i84, i85, i86, ini,
		i88, ini, i8a, ini, i8c, i8d, i8e, ini,
		i90, i91, ini, ini, i94, i95, i96, ini,
		i98, i99, i9a, ini, ini, i9d, ini, ini,
		ia0, ia1, ia2, ini, ia4, ia5, ia6, ini,
		ia8, ia9, iaa, ini, iac, iad, iae, ini,
		ib0, ib1, ini, ini, ib4, ib5, ib6, ini,
		ib8, ib9, iba, ini, ibc, ibd, ibe, ini,
		ic0, ic1, ini, ini, ic4, ic5, ic6, ini,
		ic8, ic9, ica, ini, icc, icd, ice, ini,
		id0, id1, ini, ini, ini, id5, id6, ini,
		id8, id9, ini, ini, ini, idd, ide, ini,
		ie0, ie1, ini, ini, ie4, ie5, ie6, ini,
		ie8, ie9, iea, ini, iec, ied, iee, ini,
		if0, if1, ini, ini, ini, if5, if6, ini,
		if8, if9, ini, ini, ini, ifd, ife, ini
	];

	let processorCycles: number;

	function executeNext(): ExecutionState {
		breakFlag = false;
		const instructCode = ImmediateByte();

		pc++;
		pc &= 0xffff;
		
		excycles = 0;
		addcycles = EXTRA_CYCLES[instructCode];
		INSTRUCTION2FN[instructCode]();
		
		const cycles = CYCLE_TIME[instructCode] + excycles;
		processorCycles += cycles;
		pc &= 0xffff;

		return {
			cycles: cycles,
			isBreak: breakFlag
		};
	}

	function resetCPU(): void {
		pc = 0;
		sp = 255;
		a = x = y = 0;
		flags = 32;
		breakFlag = false;
		processorCycles = 0;
	}

	function clearMemory(): void {
		RAM = [];
	}

	const _registers: CpuRegisters = {
		get a() { return a; },
		set a(value: number) { a = value; },
		get x() { return x; },
		set x(value: number) { x = value; },
		get y() { return y; },
		set y(value: number) { y = value; },
		get flags() { return flags; },
		set flags(value: number) { flags = value; },
		get sp() { return sp; },
		set sp(value: number) { sp = value; },
		get pc() { return pc; },
		set pc(value: number) { pc = value; }
	};

	return {
		get registers() { return _registers; },
		get memory() { return RAM; },
		get processorCycles() { return processorCycles; },
		executeNext: executeNext,
		resetCPU: resetCPU,
		clearMemory: clearMemory
	};
}

export type ExecutionState = {
	/** Will be true if the last instruction was a break */
	isBreak: boolean;
	/** Number of cycles the last instruction used */
	cycles: number;
}

export type CpuRegisters = {
	a: number;
	x: number;
	y: number;
	flags: number;
	sp: number;
	pc: number;
}
