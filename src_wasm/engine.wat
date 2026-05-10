(module
 (type $0 (func (param i32) (result i32)))
 (type $1 (func (param i32 i32)))
 (type $2 (func (result f64)))
 (type $3 (func (param f64)))
 (type $4 (func))
 (type $5 (func (param f64 f64) (result f64)))
 (type $6 (func (param f64) (result f64)))
 (type $7 (func (param i32)))
 (type $8 (func (param f64 f64 f64 f64) (result f64)))
 (type $9 (func (result i32)))
 (type $10 (func (param i32) (result f64)))
 (type $11 (func (param i32 f64)))
 (type $12 (func (param f64 f64 f64 f64) (result i32)))
 (type $13 (func (param i32 i32) (result i32)))
 (type $14 (func (result i64)))
 (type $15 (func (param i32 i32 i32)))
 (type $16 (func (param f64 f64 f64) (result f64)))
 (type $17 (func (param i32 i32 f64 f64) (result f64)))
 (type $18 (func (param i64 i32) (result i64)))
 (type $19 (func (param i32 i32 i32 i32)))
 (type $20 (func (param i32 i32 i64) (result i32)))
 (type $21 (func (param f64 f64) (result i32)))
 (type $22 (func (param i64)))
 (type $23 (func (param i32 f64 f64 i32)))
 (type $24 (func (param f64 i32 f64 f64) (result i32)))
 (type $25 (func (param f64 f64 f64 f64 f64 f64 f64 f64 f64 i32)))
 (type $26 (func (param i32 f64 f64) (result i32)))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $src_wasm/assembly/decimal/MIN_NORMALIZED f64 (f64.const 1))
 (global $src_wasm/assembly/decimal/MAX_NORMALIZED f64 (f64.const 10))
 (global $src_wasm/assembly/decimal/TINY f64 (f64.const 1e-15))
 (global $src_wasm/assembly/ecs/MAX_UPGRADES i32 (i32.const 512))
 (global $src_wasm/assembly/ecs/MAX_RESOURCES i32 (i32.const 256))
 (global $src_wasm/assembly/ecs/MAX_ENEMIES i32 (i32.const 128))
 (global $src_wasm/assembly/ecs/OFF_GOLD i32 (i32.const 0))
 (global $src_wasm/assembly/ecs/OFF_XP i32 (i32.const 8))
 (global $src_wasm/assembly/ecs/OFF_LEVEL i32 (i32.const 16))
 (global $src_wasm/assembly/ecs/OFF_KILLS i32 (i32.const 24))
 (global $src_wasm/assembly/ecs/OFF_MOMENTUM i32 (i32.const 32))
 (global $src_wasm/assembly/ecs/OFF_OVERCHARGE i32 (i32.const 40))
 (global $src_wasm/assembly/ecs/OFF_SEALS i32 (i32.const 48))
 (global $src_wasm/assembly/ecs/OFF_AWAKENING i32 (i32.const 52))
 (global $src_wasm/assembly/ecs/OFF_ATK i32 (i32.const 64))
 (global $src_wasm/assembly/ecs/OFF_DEF i32 (i32.const 72))
 (global $src_wasm/assembly/ecs/OFF_HP i32 (i32.const 80))
 (global $src_wasm/assembly/ecs/OFF_MAX_HP i32 (i32.const 88))
 (global $src_wasm/assembly/ecs/OFF_CRIT i32 (i32.const 96))
 (global $src_wasm/assembly/ecs/OFF_ENEMY_HP i32 (i32.const 104))
 (global $src_wasm/assembly/ecs/OFF_ENEMY_MAX_HP i32 (i32.const 112))
 (global $src_wasm/assembly/ecs/OFF_ENEMY_ATK i32 (i32.const 120))
 (global $src_wasm/assembly/ecs/OFF_ENEMY_DEF i32 (i32.const 128))
 (global $src_wasm/assembly/ecs/OFF_ENEMY_LEVEL i32 (i32.const 136))
 (global $src_wasm/assembly/ecs/OFF_COMBAT_ACTIVE i32 (i32.const 140))
 (global $src_wasm/assembly/ecs/OFF_TICK_COUNT i32 (i32.const 144))
 (global $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS i32 (i32.const 152))
 (global $src_wasm/assembly/ecs/UPGRADE_OFF i32 (i32.const 256))
 (global $src_wasm/assembly/ecs/UPGRADE_STRIDE i32 (i32.const 32))
 (global $src_wasm/assembly/ecs/MAX_UPGRADE_ID i32 (i32.const 512))
 (global $src_wasm/assembly/ecs/RESOURCE_OFF i32 (i32.const 16640))
 (global $src_wasm/assembly/ecs/RESOURCE_STRIDE i32 (i32.const 24))
 (global $src_wasm/assembly/ecs/MAX_RESOURCE_ID i32 (i32.const 256))
 (global $src_wasm/assembly/ecs/DIRTY_GOLD i32 (i32.const 0))
 (global $src_wasm/assembly/ecs/DIRTY_XP i32 (i32.const 1))
 (global $src_wasm/assembly/ecs/DIRTY_LEVEL i32 (i32.const 2))
 (global $src_wasm/assembly/ecs/DIRTY_KILLS i32 (i32.const 3))
 (global $src_wasm/assembly/ecs/DIRTY_STATS i32 (i32.const 4))
 (global $src_wasm/assembly/ecs/DIRTY_ENEMY i32 (i32.const 5))
 (global $src_wasm/assembly/ecs/DIRTY_UPGRADE_BASE i32 (i32.const 8))
 (global $src_wasm/assembly/combat/OFF_GOLD i32 (i32.const 0))
 (global $src_wasm/assembly/combat/OFF_XP i32 (i32.const 8))
 (global $src_wasm/assembly/combat/OFF_LEVEL i32 (i32.const 16))
 (global $src_wasm/assembly/combat/OFF_KILLS i32 (i32.const 24))
 (global $src_wasm/assembly/combat/OFF_MOMENTUM i32 (i32.const 32))
 (global $src_wasm/assembly/combat/OFF_OVERCHARGE i32 (i32.const 40))
 (global $src_wasm/assembly/combat/OFF_SEALS i32 (i32.const 48))
 (global $src_wasm/assembly/combat/OFF_AWAKENING i32 (i32.const 52))
 (global $src_wasm/assembly/combat/OFF_ATK i32 (i32.const 64))
 (global $src_wasm/assembly/combat/OFF_DEF i32 (i32.const 72))
 (global $src_wasm/assembly/combat/OFF_HP i32 (i32.const 80))
 (global $src_wasm/assembly/combat/OFF_MAX_HP i32 (i32.const 88))
 (global $src_wasm/assembly/combat/OFF_CRIT i32 (i32.const 96))
 (global $src_wasm/assembly/combat/OFF_ENEMY_HP i32 (i32.const 104))
 (global $src_wasm/assembly/combat/OFF_ENEMY_MAX_HP i32 (i32.const 112))
 (global $src_wasm/assembly/combat/OFF_ENEMY_ATK i32 (i32.const 120))
 (global $src_wasm/assembly/combat/OFF_ENEMY_DEF i32 (i32.const 128))
 (global $src_wasm/assembly/combat/OFF_ENEMY_LEVEL i32 (i32.const 136))
 (global $src_wasm/assembly/combat/OFF_COMBAT_ACTIVE i32 (i32.const 140))
 (global $src_wasm/assembly/combat/OFF_TICK_COUNT i32 (i32.const 144))
 (global $src_wasm/assembly/combat/_rng0 (mut i64) (i64.const 123456789))
 (global $src_wasm/assembly/combat/_rng1 (mut i64) (i64.const 987654321))
 (global $~lib/native/ASC_SHRINK_LEVEL i32 (i32.const 0))
 (global $~lib/util/math/log_tail (mut f64) (f64.const 0))
 (global $~lib/rt/itcms/total (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/threshold (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/state (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/visitCount (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/pinSpace (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/iter (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/toSpace (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/white (mut i32) (i32.const 0))
 (global $~lib/shared/runtime/Runtime.Stub i32 (i32.const 0))
 (global $~lib/shared/runtime/Runtime.Minimal i32 (i32.const 1))
 (global $~lib/shared/runtime/Runtime.Incremental i32 (i32.const 2))
 (global $~lib/rt/itcms/fromSpace (mut i32) (i32.const 0))
 (global $~lib/rt/tlsf/ROOT (mut i32) (i32.const 0))
 (global $~lib/native/ASC_LOW_MEMORY_LIMIT i32 (i32.const 0))
 (global $~lib/rt/__rtti_base i32 (i32.const 6560))
 (global $~lib/memory/__data_end i32 (i32.const 6584))
 (global $~lib/memory/__stack_pointer (mut i32) (i32.const 39352))
 (global $~lib/memory/__heap_base i32 (i32.const 39352))
 (memory $0 1)
 (data $0 (i32.const 8) "\00\00\00\00\00\a0\f6?\00\00\00\00\00\00\00\00\00\c8\b9\f2\82,\d6\bf\80V7($\b4\fa<\00\00\00\00\00\80\f6?\00\00\00\00\00\00\00\00\00\08X\bf\bd\d1\d5\bf \f7\e0\d8\08\a5\1c\bd\00\00\00\00\00`\f6?\00\00\00\00\00\00\00\00\00XE\17wv\d5\bfmP\b6\d5\a4b#\bd\00\00\00\00\00@\f6?\00\00\00\00\00\00\00\00\00\f8-\87\ad\1a\d5\bf\d5g\b0\9e\e4\84\e6\bc\00\00\00\00\00 \f6?\00\00\00\00\00\00\00\00\00xw\95_\be\d4\bf\e0>)\93i\1b\04\bd\00\00\00\00\00\00\f6?\00\00\00\00\00\00\00\00\00`\1c\c2\8ba\d4\bf\cc\84LH/\d8\13=\00\00\00\00\00\e0\f5?\00\00\00\00\00\00\00\00\00\a8\86\860\04\d4\bf:\0b\82\ed\f3B\dc<\00\00\00\00\00\c0\f5?\00\00\00\00\00\00\00\00\00HiUL\a6\d3\bf`\94Q\86\c6\b1 =\00\00\00\00\00\a0\f5?\00\00\00\00\00\00\00\00\00\80\98\9a\ddG\d3\bf\92\80\c5\d4MY%=\00\00\00\00\00\80\f5?\00\00\00\00\00\00\00\00\00 \e1\ba\e2\e8\d2\bf\d8+\b7\99\1e{&=\00\00\00\00\00`\f5?\00\00\00\00\00\00\00\00\00\88\de\13Z\89\d2\bf?\b0\cf\b6\14\ca\15=\00\00\00\00\00`\f5?\00\00\00\00\00\00\00\00\00\88\de\13Z\89\d2\bf?\b0\cf\b6\14\ca\15=\00\00\00\00\00@\f5?\00\00\00\00\00\00\00\00\00x\cf\fbA)\d2\bfv\daS($Z\16\bd\00\00\00\00\00 \f5?\00\00\00\00\00\00\00\00\00\98i\c1\98\c8\d1\bf\04T\e7h\bc\af\1f\bd\00\00\00\00\00\00\f5?\00\00\00\00\00\00\00\00\00\a8\ab\ab\\g\d1\bf\f0\a8\823\c6\1f\1f=\00\00\00\00\00\e0\f4?\00\00\00\00\00\00\00\00\00H\ae\f9\8b\05\d1\bffZ\05\fd\c4\a8&\bd\00\00\00\00\00\c0\f4?\00\00\00\00\00\00\00\00\00\90s\e2$\a3\d0\bf\0e\03\f4~\eek\0c\bd\00\00\00\00\00\a0\f4?\00\00\00\00\00\00\00\00\00\d0\b4\94%@\d0\bf\7f-\f4\9e\b86\f0\bc\00\00\00\00\00\a0\f4?\00\00\00\00\00\00\00\00\00\d0\b4\94%@\d0\bf\7f-\f4\9e\b86\f0\bc\00\00\00\00\00\80\f4?\00\00\00\00\00\00\00\00\00@^m\18\b9\cf\bf\87<\99\ab*W\r=\00\00\00\00\00`\f4?\00\00\00\00\00\00\00\00\00`\dc\cb\ad\f0\ce\bf$\af\86\9c\b7&+=\00\00\00\00\00@\f4?\00\00\00\00\00\00\00\00\00\f0*n\07\'\ce\bf\10\ff?TO/\17\bd\00\00\00\00\00 \f4?\00\00\00\00\00\00\00\00\00\c0Ok!\\\cd\bf\1bh\ca\bb\91\ba!=\00\00\00\00\00\00\f4?\00\00\00\00\00\00\00\00\00\a0\9a\c7\f7\8f\cc\bf4\84\9fhOy\'=\00\00\00\00\00\00\f4?\00\00\00\00\00\00\00\00\00\a0\9a\c7\f7\8f\cc\bf4\84\9fhOy\'=\00\00\00\00\00\e0\f3?\00\00\00\00\00\00\00\00\00\90-t\86\c2\cb\bf\8f\b7\8b1\b0N\19=\00\00\00\00\00\c0\f3?\00\00\00\00\00\00\00\00\00\c0\80N\c9\f3\ca\bff\90\cd?cN\ba<\00\00\00\00\00\a0\f3?\00\00\00\00\00\00\00\00\00\b0\e2\1f\bc#\ca\bf\ea\c1F\dcd\8c%\bd\00\00\00\00\00\a0\f3?\00\00\00\00\00\00\00\00\00\b0\e2\1f\bc#\ca\bf\ea\c1F\dcd\8c%\bd\00\00\00\00\00\80\f3?\00\00\00\00\00\00\00\00\00P\f4\9cZR\c9\bf\e3\d4\c1\04\d9\d1*\bd\00\00\00\00\00`\f3?\00\00\00\00\00\00\00\00\00\d0 e\a0\7f\c8\bf\t\fa\db\7f\bf\bd+=\00\00\00\00\00@\f3?\00\00\00\00\00\00\00\00\00\e0\10\02\89\ab\c7\bfXJSr\90\db+=\00\00\00\00\00@\f3?\00\00\00\00\00\00\00\00\00\e0\10\02\89\ab\c7\bfXJSr\90\db+=\00\00\00\00\00 \f3?\00\00\00\00\00\00\00\00\00\d0\19\e7\0f\d6\c6\bff\e2\b2\a3j\e4\10\bd\00\00\00\00\00\00\f3?\00\00\00\00\00\00\00\00\00\90\a7p0\ff\c5\bf9P\10\9fC\9e\1e\bd\00\00\00\00\00\00\f3?\00\00\00\00\00\00\00\00\00\90\a7p0\ff\c5\bf9P\10\9fC\9e\1e\bd\00\00\00\00\00\e0\f2?\00\00\00\00\00\00\00\00\00\b0\a1\e3\e5&\c5\bf\8f[\07\90\8b\de \bd\00\00\00\00\00\c0\f2?\00\00\00\00\00\00\00\00\00\80\cbl+M\c4\bf<x5a\c1\0c\17=\00\00\00\00\00\c0\f2?\00\00\00\00\00\00\00\00\00\80\cbl+M\c4\bf<x5a\c1\0c\17=\00\00\00\00\00\a0\f2?\00\00\00\00\00\00\00\00\00\90\1e \fcq\c3\bf:T\'M\86x\f1<\00\00\00\00\00\80\f2?\00\00\00\00\00\00\00\00\00\f0\1f\f8R\95\c2\bf\08\c4q\170\8d$\bd\00\00\00\00\00`\f2?\00\00\00\00\00\00\00\00\00`/\d5*\b7\c1\bf\96\a3\11\18\a4\80.\bd\00\00\00\00\00`\f2?\00\00\00\00\00\00\00\00\00`/\d5*\b7\c1\bf\96\a3\11\18\a4\80.\bd\00\00\00\00\00@\f2?\00\00\00\00\00\00\00\00\00\90\d0|~\d7\c0\bf\f4[\e8\88\96i\n=\00\00\00\00\00@\f2?\00\00\00\00\00\00\00\00\00\90\d0|~\d7\c0\bf\f4[\e8\88\96i\n=\00\00\00\00\00 \f2?\00\00\00\00\00\00\00\00\00\e0\db1\91\ec\bf\bf\f23\a3\\Tu%\bd\00\00\00\00\00\00\f2?\00\00\00\00\00\00\00\00\00\00+n\07\'\be\bf<\00\f0*,4*=\00\00\00\00\00\00\f2?\00\00\00\00\00\00\00\00\00\00+n\07\'\be\bf<\00\f0*,4*=\00\00\00\00\00\e0\f1?\00\00\00\00\00\00\00\00\00\c0[\8fT^\bc\bf\06\be_XW\0c\1d\bd\00\00\00\00\00\c0\f1?\00\00\00\00\00\00\00\00\00\e0J:m\92\ba\bf\c8\aa[\e859%=\00\00\00\00\00\c0\f1?\00\00\00\00\00\00\00\00\00\e0J:m\92\ba\bf\c8\aa[\e859%=\00\00\00\00\00\a0\f1?\00\00\00\00\00\00\00\00\00\a01\d6E\c3\b8\bfhV/M)|\13=\00\00\00\00\00\a0\f1?\00\00\00\00\00\00\00\00\00\a01\d6E\c3\b8\bfhV/M)|\13=\00\00\00\00\00\80\f1?\00\00\00\00\00\00\00\00\00`\e5\8a\d2\f0\b6\bf\das3\c97\97&\bd\00\00\00\00\00`\f1?\00\00\00\00\00\00\00\00\00 \06?\07\1b\b5\bfW^\c6a[\02\1f=\00\00\00\00\00`\f1?\00\00\00\00\00\00\00\00\00 \06?\07\1b\b5\bfW^\c6a[\02\1f=\00\00\00\00\00@\f1?\00\00\00\00\00\00\00\00\00\e0\1b\96\d7A\b3\bf\df\13\f9\cc\da^,=\00\00\00\00\00@\f1?\00\00\00\00\00\00\00\00\00\e0\1b\96\d7A\b3\bf\df\13\f9\cc\da^,=\00\00\00\00\00 \f1?\00\00\00\00\00\00\00\00\00\80\a3\ee6e\b1\bf\t\a3\8fv^|\14=\00\00\00\00\00\00\f1?\00\00\00\00\00\00\00\00\00\80\11\c00\n\af\bf\91\8e6\83\9eY-=\00\00\00\00\00\00\f1?\00\00\00\00\00\00\00\00\00\80\11\c00\n\af\bf\91\8e6\83\9eY-=\00\00\00\00\00\e0\f0?\00\00\00\00\00\00\00\00\00\80\19q\ddB\ab\bfLp\d6\e5z\82\1c=\00\00\00\00\00\e0\f0?\00\00\00\00\00\00\00\00\00\80\19q\ddB\ab\bfLp\d6\e5z\82\1c=\00\00\00\00\00\c0\f0?\00\00\00\00\00\00\00\00\00\c02\f6Xt\a7\bf\ee\a1\f24F\fc,\bd\00\00\00\00\00\c0\f0?\00\00\00\00\00\00\00\00\00\c02\f6Xt\a7\bf\ee\a1\f24F\fc,\bd\00\00\00\00\00\a0\f0?\00\00\00\00\00\00\00\00\00\c0\fe\b9\87\9e\a3\bf\aa\fe&\f5\b7\02\f5<\00\00\00\00\00\a0\f0?\00\00\00\00\00\00\00\00\00\c0\fe\b9\87\9e\a3\bf\aa\fe&\f5\b7\02\f5<\00\00\00\00\00\80\f0?\00\00\00\00\00\00\00\00\00\00x\0e\9b\82\9f\bf\e4\t~|&\80)\bd\00\00\00\00\00\80\f0?\00\00\00\00\00\00\00\00\00\00x\0e\9b\82\9f\bf\e4\t~|&\80)\bd\00\00\00\00\00`\f0?\00\00\00\00\00\00\00\00\00\80\d5\07\1b\b9\97\bf9\a6\fa\93T\8d(\bd\00\00\00\00\00@\f0?\00\00\00\00\00\00\00\00\00\00\fc\b0\a8\c0\8f\bf\9c\a6\d3\f6|\1e\df\bc\00\00\00\00\00@\f0?\00\00\00\00\00\00\00\00\00\00\fc\b0\a8\c0\8f\bf\9c\a6\d3\f6|\1e\df\bc\00\00\00\00\00 \f0?\00\00\00\00\00\00\00\00\00\00\10k*\e0\7f\bf\e4@\da\r?\e2\19\bd\00\00\00\00\00 \f0?\00\00\00\00\00\00\00\00\00\00\10k*\e0\7f\bf\e4@\da\r?\e2\19\bd\00\00\00\00\00\00\f0?\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\f0?\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\c0\ef?\00\00\00\00\00\00\00\00\00\00\89u\15\10\80?\e8+\9d\99k\c7\10\bd\00\00\00\00\00\80\ef?\00\00\00\00\00\00\00\00\00\80\93XV \90?\d2\f7\e2\06[\dc#\bd\00\00\00\00\00@\ef?\00\00\00\00\00\00\00\00\00\00\c9(%I\98?4\0cZ2\ba\a0*\bd\00\00\00\00\00\00\ef?\00\00\00\00\00\00\00\00\00@\e7\89]A\a0?S\d7\f1\\\c0\11\01=\00\00\00\00\00\c0\ee?\00\00\00\00\00\00\00\00\00\00.\d4\aef\a4?(\fd\bdus\16,\bd\00\00\00\00\00\80\ee?\00\00\00\00\00\00\00\00\00\c0\9f\14\aa\94\a8?}&Z\d0\95y\19\bd\00\00\00\00\00@\ee?\00\00\00\00\00\00\00\00\00\c0\dd\cds\cb\ac?\07(\d8G\f2h\1a\bd\00\00\00\00\00 \ee?\00\00\00\00\00\00\00\00\00\c0\06\c01\ea\ae?{;\c9O>\11\0e\bd\00\00\00\00\00\e0\ed?\00\00\00\00\00\00\00\00\00`F\d1;\97\b1?\9b\9e\rV]2%\bd\00\00\00\00\00\a0\ed?\00\00\00\00\00\00\00\00\00\e0\d1\a7\f5\bd\b3?\d7N\db\a5^\c8,=\00\00\00\00\00`\ed?\00\00\00\00\00\00\00\00\00\a0\97MZ\e9\b5?\1e\1d]<\06i,\bd\00\00\00\00\00@\ed?\00\00\00\00\00\00\00\00\00\c0\ea\n\d3\00\b7?2\ed\9d\a9\8d\1e\ec<\00\00\00\00\00\00\ed?\00\00\00\00\00\00\00\00\00@Y]^3\b9?\daG\bd:\\\11#=\00\00\00\00\00\c0\ec?\00\00\00\00\00\00\00\00\00`\ad\8d\c8j\bb?\e5h\f7+\80\90\13\bd\00\00\00\00\00\a0\ec?\00\00\00\00\00\00\00\00\00@\bc\01X\88\bc?\d3\acZ\c6\d1F&=\00\00\00\00\00`\ec?\00\00\00\00\00\00\00\00\00 \n\839\c7\be?\e0E\e6\afh\c0-\bd\00\00\00\00\00@\ec?\00\00\00\00\00\00\00\00\00\e0\db9\91\e8\bf?\fd\n\a1O\d64%\bd\00\00\00\00\00\00\ec?\00\00\00\00\00\00\00\00\00\e0\'\82\8e\17\c1?\f2\07-\cex\ef!=\00\00\00\00\00\e0\eb?\00\00\00\00\00\00\00\00\00\f0#~+\aa\c1?4\998D\8e\a7,=\00\00\00\00\00\a0\eb?\00\00\00\00\00\00\00\00\00\80\86\0ca\d1\c2?\a1\b4\81\cbl\9d\03=\00\00\00\00\00\80\eb?\00\00\00\00\00\00\00\00\00\90\15\b0\fce\c3?\89rK#\a8/\c6<\00\00\00\00\00@\eb?\00\00\00\00\00\00\00\00\00\b03\83=\91\c4?x\b6\fdTy\83%=\00\00\00\00\00 \eb?\00\00\00\00\00\00\00\00\00\b0\a1\e4\e5\'\c5?\c7}i\e5\e83&=\00\00\00\00\00\e0\ea?\00\00\00\00\00\00\00\00\00\10\8c\beNW\c6?x.<,\8b\cf\19=\00\00\00\00\00\c0\ea?\00\00\00\00\00\00\00\00\00pu\8b\12\f0\c6?\e1!\9c\e5\8d\11%\bd\00\00\00\00\00\a0\ea?\00\00\00\00\00\00\00\00\00PD\85\8d\89\c7?\05C\91p\10f\1c\bd\00\00\00\00\00`\ea?\00\00\00\00\00\00\00\00\00\009\eb\af\be\c8?\d1,\e9\aaT=\07\bd\00\00\00\00\00@\ea?\00\00\00\00\00\00\00\00\00\00\f7\dcZZ\c9?o\ff\a0X(\f2\07=\00\00\00\00\00\00\ea?\00\00\00\00\00\00\00\00\00\e0\8a<\ed\93\ca?i!VPCr(\bd\00\00\00\00\00\e0\e9?\00\00\00\00\00\00\00\00\00\d0[W\d81\cb?\aa\e1\acN\8d5\0c\bd\00\00\00\00\00\c0\e9?\00\00\00\00\00\00\00\00\00\e0;8\87\d0\cb?\b6\12TY\c4K-\bd\00\00\00\00\00\a0\e9?\00\00\00\00\00\00\00\00\00\10\f0\c6\fbo\cc?\d2+\96\c5r\ec\f1\bc\00\00\00\00\00`\e9?\00\00\00\00\00\00\00\00\00\90\d4\b0=\b1\cd?5\b0\15\f7*\ff*\bd\00\00\00\00\00@\e9?\00\00\00\00\00\00\00\00\00\10\e7\ff\0eS\ce?0\f4A`\'\12\c2<\00\00\00\00\00 \e9?\00\00\00\00\00\00\00\00\00\00\dd\e4\ad\f5\ce?\11\8e\bbe\15!\ca\bc\00\00\00\00\00\00\e9?\00\00\00\00\00\00\00\00\00\b0\b3l\1c\99\cf?0\df\0c\ca\ec\cb\1b=\00\00\00\00\00\c0\e8?\00\00\00\00\00\00\00\00\00XM`8q\d0?\91N\ed\16\db\9c\f8<\00\00\00\00\00\a0\e8?\00\00\00\00\00\00\00\00\00`ag-\c4\d0?\e9\ea<\16\8b\18\'=\00\00\00\00\00\80\e8?\00\00\00\00\00\00\00\00\00\e8\'\82\8e\17\d1?\1c\f0\a5c\0e!,\bd\00\00\00\00\00`\e8?\00\00\00\00\00\00\00\00\00\f8\ac\cb\\k\d1?\81\16\a5\f7\cd\9a+=\00\00\00\00\00@\e8?\00\00\00\00\00\00\00\00\00hZc\99\bf\d1?\b7\bdGQ\ed\a6,=\00\00\00\00\00 \e8?\00\00\00\00\00\00\00\00\00\b8\0emE\14\d2?\ea\baF\ba\de\87\n=\00\00\00\00\00\e0\e7?\00\00\00\00\00\00\00\00\00\90\dc|\f0\be\d2?\f4\04PJ\fa\9c*=\00\00\00\00\00\c0\e7?\00\00\00\00\00\00\00\00\00`\d3\e1\f1\14\d3?\b8<!\d3z\e2(\bd\00\00\00\00\00\a0\e7?\00\00\00\00\00\00\00\00\00\10\bevgk\d3?\c8w\f1\b0\cdn\11=\00\00\00\00\00\80\e7?\00\00\00\00\00\00\00\00\0003wR\c2\d3?\\\bd\06\b6T;\18=\00\00\00\00\00`\e7?\00\00\00\00\00\00\00\00\00\e8\d5#\b4\19\d4?\9d\e0\90\ec6\e4\08=\00\00\00\00\00@\e7?\00\00\00\00\00\00\00\00\00\c8q\c2\8dq\d4?u\d6g\t\ce\'/\bd\00\00\00\00\00 \e7?\00\00\00\00\00\00\00\00\000\17\9e\e0\c9\d4?\a4\d8\n\1b\89 .\bd\00\00\00\00\00\00\e7?\00\00\00\00\00\00\00\00\00\a08\07\ae\"\d5?Y\c7d\81p\be.=\00\00\00\00\00\e0\e6?\00\00\00\00\00\00\00\00\00\d0\c8S\f7{\d5?\ef@]\ee\ed\ad\1f=\00\00\00\00\00\c0\e6?\00\00\00\00\00\00\00\00\00`Y\df\bd\d5\d5?\dce\a4\08*\0b\n\bd")
 (data $1 (i32.const 4104) "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\f0?n\bf\88\1aO;\9b<53\fb\a9=\f6\ef?]\dc\d8\9c\13`q\bca\80w>\9a\ec\ef?\d1f\87\10z^\90\bc\85\7fn\e8\15\e3\ef?\13\f6g5R\d2\8c<t\85\15\d3\b0\d9\ef?\fa\8e\f9#\80\ce\8b\bc\de\f6\dd)k\d0\ef?a\c8\e6aN\f7`<\c8\9bu\18E\c7\ef?\99\d33[\e4\a3\90<\83\f3\c6\ca>\be\ef?m{\83]\a6\9a\97<\0f\89\f9lX\b5\ef?\fc\ef\fd\92\1a\b5\8e<\f7Gr+\92\ac\ef?\d1\9c/p=\be><\a2\d1\d32\ec\a3\ef?\0bn\90\894\03j\bc\1b\d3\fe\aff\9b\ef?\0e\bd/*RV\95\bcQ[\12\d0\01\93\ef?U\eaN\8c\ef\80P\bc\cc1l\c0\bd\8a\ef?\16\f4\d5\b9#\c9\91\bc\e0-\a9\ae\9a\82\ef?\afU\\\e9\e3\d3\80<Q\8e\a5\c8\98z\ef?H\93\a5\ea\15\1b\80\bc{Q}<\b8r\ef?=2\deU\f0\1f\8f\bc\ea\8d\8c8\f9j\ef?\bfS\13?\8c\89\8b<u\cbo\eb[c\ef?&\eb\11v\9c\d9\96\bc\d4\\\04\84\e0[\ef?`/:>\f7\ec\9a<\aa\b9h1\87T\ef?\9d8\86\cb\82\e7\8f\bc\1d\d9\fc\"PM\ef?\8d\c3\a6DAo\8a<\d6\8cb\88;F\ef?}\04\e4\b0\05z\80<\96\dc}\91I?\ef?\94\a8\a8\e3\fd\8e\96<8bunz8\ef?}Ht\f2\18^\87<?\a6\b2O\ce1\ef?\f2\e7\1f\98+G\80<\dd|\e2eE+\ef?^\08q?{\b8\96\bc\81c\f5\e1\df$\ef?1\ab\tm\e1\f7\82<\e1\de\1f\f5\9d\1e\ef?\fa\bfo\1a\9b!=\bc\90\d9\da\d0\7f\18\ef?\b4\n\0cr\827\8b<\0b\03\e4\a6\85\12\ef?\8f\cb\ce\89\92\14n<V/>\a9\af\0c\ef?\b6\ab\b0MuM\83<\15\b71\n\fe\06\ef?Lt\ac\e2\01B\86<1\d8L\fcp\01\ef?J\f8\d3]9\dd\8f<\ff\16d\b2\08\fc\ee?\04[\8e;\80\a3\86\bc\f1\9f\92_\c5\f6\ee?hPK\cc\edJ\92\bc\cb\a9:7\a7\f1\ee?\8e-Q\1b\f8\07\99\bcf\d8\05m\ae\ec\ee?\d26\94>\e8\d1q\bc\f7\9f\e54\db\e7\ee?\15\1b\ce\b3\19\19\99\bc\e5\a8\13\c3-\e3\ee?mL*\a7H\9f\85<\"4\12L\a6\de\ee?\8ai(z`\12\93\bc\1c\80\ac\04E\da\ee?[\89\17H\8f\a7X\bc*.\f7!\n\d6\ee?\1b\9aIg\9b,|\bc\97\a8P\d9\f5\d1\ee?\11\ac\c2`\edcC<-\89a`\08\ce\ee?\efd\06;\tf\96<W\00\1d\edA\ca\ee?y\03\a1\da\e1\ccn<\d0<\c1\b5\a2\c6\ee?0\12\0f?\8e\ff\93<\de\d3\d7\f0*\c3\ee?\b0\afz\bb\ce\90v<\'*6\d5\da\bf\ee?w\e0T\eb\bd\1d\93<\r\dd\fd\99\b2\bc\ee?\8e\a3q\004\94\8f\bc\a7,\9dv\b2\b9\ee?I\a3\93\dc\cc\de\87\bcBf\cf\a2\da\b6\ee?_8\0f\bd\c6\dex\bc\82O\9dV+\b4\ee?\f6\\{\ecF\12\86\bc\0f\92]\ca\a4\b1\ee?\8e\d7\fd\18\055\93<\da\'\b56G\af\ee?\05\9b\8a/\b7\98{<\fd\c7\97\d4\12\ad\ee?\tT\1c\e2\e1c\90<)TH\dd\07\ab\ee?\ea\c6\19P\85\c74<\b7FY\8a&\a9\ee?5\c0d+\e62\94<H!\ad\15o\a7\ee?\9fv\99aJ\e4\8c\bc\t\dcv\b9\e1\a5\ee?\a8M\ef;\c53\8c\bc\85U:\b0~\a4\ee?\ae\e9+\89xS\84\bc \c3\cc4F\a3\ee?XXVx\dd\ce\93\bc%\"U\828\a2\ee?d\19~\80\aa\10W<s\a9L\d4U\a1\ee?(\"^\bf\ef\b3\93\bc\cd;\7ff\9e\a0\ee?\82\b94\87\ad\12j\bc\bf\da\0bu\12\a0\ee?\ee\a9m\b8\efgc\bc/\1ae<\b2\9f\ee?Q\88\e0T=\dc\80\bc\84\94Q\f9}\9f\ee?\cf>Z~d\1fx\bct_\ec\e8u\9f\ee?\b0}\8b\c0J\ee\86\bct\81\a5H\9a\9f\ee?\8a\e6U\1e2\19\86\bc\c9gBV\eb\9f\ee?\d3\d4\t^\cb\9c\90<?]\deOi\a0\ee?\1d\a5M\b9\dc2{\bc\87\01\ebs\14\a1\ee?k\c0gT\fd\ec\94<2\c10\01\ed\a1\ee?Ul\d6\ab\e1\ebe<bN\cf6\f3\a2\ee?B\cf\b3/\c5\a1\88\bc\12\1a>T\'\a4\ee?47;\f1\b6i\93\bc\13\ceL\99\89\a5\ee?\1e\ff\19:\84^\80\bc\ad\c7#F\1a\a7\ee?nWr\d8P\d4\94\bc\ed\92D\9b\d9\a8\ee?\00\8a\0e[g\ad\90<\99f\8a\d9\c7\aa\ee?\b4\ea\f0\c1/\b7\8d<\db\a0*B\e5\ac\ee?\ff\e7\c5\9c`\b6e\bc\8cD\b5\162\af\ee?D_\f3Y\83\f6{<6w\15\99\ae\b1\ee?\83=\1e\a7\1f\t\93\bc\c6\ff\91\0b[\b4\ee?)\1el\8b\b8\a9]\bc\e5\c5\cd\b07\b7\ee?Y\b9\90|\f9#l\bc\0fR\c8\cbD\ba\ee?\aa\f9\f4\"CC\92\bcPN\de\9f\82\bd\ee?K\8ef\d7l\ca\85\bc\ba\07\cap\f1\c0\ee?\'\ce\91+\fc\afq<\90\f0\a3\82\91\c4\ee?\bbs\n\e15\d2m<##\e3\19c\c8\ee?c\"b\"\04\c5\87\bce\e5]{f\cc\ee?\d51\e2\e3\86\1c\8b<3-J\ec\9b\d0\ee?\15\bb\bc\d3\d1\bb\91\bc]%>\b2\03\d5\ee?\d21\ee\9c1\cc\90<X\b30\13\9e\d9\ee?\b3Zsn\84i\84<\bf\fdyUk\de\ee?\b4\9d\8e\97\cd\df\82\bcz\f3\d3\bfk\e3\ee?\873\cb\92w\1a\8c<\ad\d3Z\99\9f\e8\ee?\fa\d9\d1J\8f{\90\bcf\b6\8d)\07\ee\ee?\ba\ae\dcV\d9\c3U\bc\fb\15O\b8\a2\f3\ee?@\f6\a6=\0e\a4\90\bc:Y\e5\8dr\f9\ee?4\93\ad8\f4\d6h\bcG^\fb\f2v\ff\ee?5\8aXk\e2\ee\91\bcJ\06\a10\b0\05\ef?\cd\dd_\n\d7\fft<\d2\c1K\90\1e\0c\ef?\ac\98\92\fa\fb\bd\91\bc\t\1e\d7[\c2\12\ef?\b3\0c\af0\aens<\9cR\85\dd\9b\19\ef?\94\fd\9f\\2\e3\8e<z\d0\ff_\ab \ef?\acY\t\d1\8f\e0\84<K\d1W.\f1\'\ef?g\1aN8\af\cdc<\b5\e7\06\94m/\ef?h\19\92l,kg<i\90\ef\dc 7\ef?\d2\b5\cc\83\18\8a\80\bc\fa\c3]U\0b?\ef?o\fa\ff?]\ad\8f\bc|\89\07J-G\ef?I\a9u8\ae\r\90\bc\f2\89\r\08\87O\ef?\a7\07=\a6\85\a3t<\87\a4\fb\dc\18X\ef?\0f\"@ \9e\91\82\bc\98\83\c9\16\e3`\ef?\ac\92\c1\d5PZ\8e<\852\db\03\e6i\ef?Kk\01\acY:\84<`\b4\01\f3!s\ef?\1f>\b4\07!\d5\82\bc_\9b{3\97|\ef?\c9\rG;\b9*\89\bc)\a1\f5\14F\86\ef?\d3\88:`\04\b6t<\f6?\8b\e7.\90\ef?qr\9dQ\ec\c5\83<\83L\c7\fbQ\9a\ef?\f0\91\d3\8f\12\f7\8f\bc\da\90\a4\a2\af\a4\ef?}t#\e2\98\ae\8d\bc\f1g\8e-H\af\ef?\08 \aaA\bc\c3\8e<\'Za\ee\1b\ba\ef?2\eb\a9\c3\94+\84<\97\bak7+\c5\ef?\ee\85\d11\a9d\8a<@En[v\d0\ef?\ed\e3;\e4\ba7\8e\bc\14\be\9c\ad\fd\db\ef?\9d\cd\91M;\89w<\d8\90\9e\81\c1\e7\ef?\89\cc`A\c1\05S<\f1q\8f+\c2\f3\ef?")
 (data $2 (i32.const 6156) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e\00\00\00\00\00")
 (data $3 (i32.const 6220) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00 \00\00\00~\00l\00i\00b\00/\00r\00t\00/\00i\00t\00c\00m\00s\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $4 (i32.const 6288) "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $5 (i32.const 6320) "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $6 (i32.const 6348) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00$\00\00\00I\00n\00d\00e\00x\00 \00o\00u\00t\00 \00o\00f\00 \00r\00a\00n\00g\00e\00\00\00\00\00\00\00\00\00")
 (data $7 (i32.const 6412) ",\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\14\00\00\00~\00l\00i\00b\00/\00r\00t\00.\00t\00s\00\00\00\00\00\00\00\00\00")
 (data $8 (i32.const 6464) "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $9 (i32.const 6492) "<\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00t\00l\00s\00f\00.\00t\00s\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data $10 (i32.const 6560) "\05\00\00\00 \00\00\00 \00\00\00 \00\00\00\00\00\00\00 \00\00\00")
 (table $0 1 1 funcref)
 (elem $0 (i32.const 1))
 (export "init" (func $src_wasm/assembly/index/init))
 (export "decimal_add" (func $src_wasm/assembly/decimal/decimal_add))
 (export "decimal_add_exp" (func $src_wasm/assembly/decimal/decimal_add_exp))
 (export "decimal_sub" (func $src_wasm/assembly/decimal/decimal_sub))
 (export "decimal_sub_exp" (func $src_wasm/assembly/decimal/decimal_sub_exp))
 (export "decimal_mul" (func $src_wasm/assembly/decimal/decimal_mul))
 (export "decimal_mul_exp" (func $src_wasm/assembly/decimal/decimal_mul_exp))
 (export "decimal_div" (func $src_wasm/assembly/decimal/decimal_div))
 (export "decimal_div_exp" (func $src_wasm/assembly/decimal/decimal_div_exp))
 (export "decimal_wasmPow" (func $src_wasm/assembly/decimal/decimal_wasmPow))
 (export "decimal_wasmPow_exp" (func $src_wasm/assembly/decimal/decimal_wasmPow_exp))
 (export "decimal_abs" (func $src_wasm/assembly/decimal/decimal_abs))
 (export "decimal_wasmFloor" (func $src_wasm/assembly/decimal/decimal_wasmFloor))
 (export "decimal_wasmSqrt" (func $src_wasm/assembly/decimal/decimal_wasmSqrt))
 (export "decimal_wasmSqrt_exp" (func $src_wasm/assembly/decimal/decimal_wasmSqrt_exp))
 (export "decimal_wasmLog10" (func $src_wasm/assembly/decimal/decimal_wasmLog10))
 (export "decimal_gte" (func $src_wasm/assembly/decimal/decimal_gte))
 (export "decimal_lt" (func $src_wasm/assembly/decimal/decimal_lt))
 (export "decimal_eq" (func $src_wasm/assembly/decimal/decimal_eq))
 (export "decimal_isZero" (func $src_wasm/assembly/decimal/decimal_isZero))
 (export "ecs_player_getGold" (func $src_wasm/assembly/ecs/ecs_player_getGold))
 (export "ecs_player_setGold" (func $src_wasm/assembly/ecs/ecs_player_setGold))
 (export "ecs_player_addGold" (func $src_wasm/assembly/ecs/ecs_player_addGold))
 (export "ecs_player_getXP" (func $src_wasm/assembly/ecs/ecs_player_getXP))
 (export "ecs_player_setXP" (func $src_wasm/assembly/ecs/ecs_player_setXP))
 (export "ecs_player_addXP" (func $src_wasm/assembly/ecs/ecs_player_addXP))
 (export "ecs_player_getLevel" (func $src_wasm/assembly/ecs/ecs_player_getLevel))
 (export "ecs_player_incLevel" (func $src_wasm/assembly/ecs/ecs_player_incLevel))
 (export "ecs_player_getKills" (func $src_wasm/assembly/ecs/ecs_player_getKills))
 (export "ecs_player_incKills" (func $src_wasm/assembly/ecs/ecs_player_incKills))
 (export "ecs_player_getMomentum" (func $src_wasm/assembly/ecs/ecs_player_getMomentum))
 (export "ecs_player_setMomentum" (func $src_wasm/assembly/ecs/ecs_player_setMomentum))
 (export "ecs_player_getOvercharge" (func $src_wasm/assembly/ecs/ecs_player_getOvercharge))
 (export "ecs_player_setOvercharge" (func $src_wasm/assembly/ecs/ecs_player_setOvercharge))
 (export "ecs_player_getAtk" (func $src_wasm/assembly/ecs/ecs_player_getAtk))
 (export "ecs_player_setAtk" (func $src_wasm/assembly/ecs/ecs_player_setAtk))
 (export "ecs_player_getDef" (func $src_wasm/assembly/ecs/ecs_player_getDef))
 (export "ecs_player_setDef" (func $src_wasm/assembly/ecs/ecs_player_setDef))
 (export "ecs_player_getHP" (func $src_wasm/assembly/ecs/ecs_player_getHP))
 (export "ecs_player_setHP" (func $src_wasm/assembly/ecs/ecs_player_setHP))
 (export "ecs_player_getCrit" (func $src_wasm/assembly/ecs/ecs_player_getCrit))
 (export "ecs_player_setCrit" (func $src_wasm/assembly/ecs/ecs_player_setCrit))
 (export "ecs_upgrade_getLevel" (func $src_wasm/assembly/ecs/ecs_upgrade_getLevel))
 (export "ecs_upgrade_setLevel" (func $src_wasm/assembly/ecs/ecs_upgrade_setLevel))
 (export "ecs_upgrade_incLevel" (func $src_wasm/assembly/ecs/ecs_upgrade_incLevel))
 (export "ecs_upgrade_getCostBase" (func $src_wasm/assembly/ecs/ecs_upgrade_getCostBase))
 (export "ecs_upgrade_getCostGain" (func $src_wasm/assembly/ecs/ecs_upgrade_getCostGain))
 (export "ecs_upgrade_getCostType" (func $src_wasm/assembly/ecs/ecs_upgrade_getCostType))
 (export "ecs_upgrade_setCostParams" (func $src_wasm/assembly/ecs/ecs_upgrade_setCostParams))
 (export "ecs_resource_getAmount" (func $src_wasm/assembly/ecs/ecs_resource_getAmount))
 (export "ecs_resource_setAmount" (func $src_wasm/assembly/ecs/ecs_resource_setAmount))
 (export "ecs_resource_addAmount" (func $src_wasm/assembly/ecs/ecs_resource_addAmount))
 (export "ecs_resource_getRate" (func $src_wasm/assembly/ecs/ecs_resource_getRate))
 (export "ecs_resource_setRate" (func $src_wasm/assembly/ecs/ecs_resource_setRate))
 (export "ecs_enemy_getHP" (func $src_wasm/assembly/ecs/ecs_enemy_getHP))
 (export "ecs_enemy_setHP" (func $src_wasm/assembly/ecs/ecs_enemy_setHP))
 (export "ecs_enemy_getMaxHP" (func $src_wasm/assembly/ecs/ecs_enemy_getMaxHP))
 (export "ecs_enemy_setMaxHP" (func $src_wasm/assembly/ecs/ecs_enemy_setMaxHP))
 (export "ecs_enemy_getAtk" (func $src_wasm/assembly/ecs/ecs_enemy_getAtk))
 (export "ecs_enemy_getDef" (func $src_wasm/assembly/ecs/ecs_enemy_getDef))
 (export "ecs_enemy_getLevel" (func $src_wasm/assembly/ecs/ecs_enemy_getLevel))
 (export "ecs_combat_isActive" (func $src_wasm/assembly/ecs/ecs_combat_isActive))
 (export "ecs_combat_setActive" (func $src_wasm/assembly/ecs/ecs_combat_setActive))
 (export "world_getTickCount" (func $src_wasm/assembly/ecs/world_getTickCount))
 (export "world_incTick" (func $src_wasm/assembly/ecs/world_incTick))
 (export "world_getDirtyFlags" (func $src_wasm/assembly/ecs/world_getDirtyFlags))
 (export "world_clearDirty" (func $src_wasm/assembly/ecs/world_clearDirty))
 (export "world_clearAllDirty" (func $src_wasm/assembly/ecs/world_clearAllDirty))
 (export "world_init" (func $src_wasm/assembly/ecs/world_init))
 (export "cost_linear" (func $src_wasm/assembly/ecs/cost_linear))
 (export "cost_geometric" (func $src_wasm/assembly/ecs/cost_geometric))
 (export "cost_maxAffordable_linear" (func $src_wasm/assembly/ecs/cost_maxAffordable_linear))
 (export "combat_spawnEnemy" (func $src_wasm/assembly/combat/combat_spawnEnemy))
 (export "combat_tick" (func $src_wasm/assembly/combat/combat_tick))
 (export "stats_aggregate" (func $src_wasm/assembly/combat/stats_aggregate))
 (export "world_tick" (func $src_wasm/assembly/combat/world_tick))
 (export "memory" (memory $0))
 (start $~start)
 (func $src_wasm/assembly/ecs/world_init
  i32.const 0
  i32.const 0
  i32.store
  i32.const 4
  i32.const 0
  i32.store
  i32.const 8
  i32.const 0
  i32.store
  i32.const 12
  i32.const 0
  i32.store
  i32.const 16
  i32.const 1
  i32.store
  i32.const 20
  i32.const 0
  i32.store
  i32.const 24
  i32.const 0
  i32.store
  i32.const 28
  i32.const 0
  i32.store
  i32.const 32
  i32.const 0
  i32.store
  i32.const 36
  i32.const 0
  i32.store
  i32.const 40
  i32.const 0
  i32.store
  i32.const 44
  i32.const 0
  i32.store
  i32.const 48
  i32.const 0
  i32.store
  i32.const 52
  i32.const 0
  i32.store
  i32.const 56
  i32.const 0
  i32.store
  i32.const 60
  i32.const 0
  i32.store
  i32.const 64
  i32.const 0
  i32.store
  i32.const 68
  i32.const 0
  i32.store
  i32.const 72
  i32.const 0
  i32.store
  i32.const 76
  i32.const 0
  i32.store
  i32.const 80
  i32.const 0
  i32.store
  i32.const 84
  i32.const 0
  i32.store
  i32.const 88
  i32.const 100
  i32.store
  i32.const 92
  i32.const 0
  i32.store
  i32.const 96
  i32.const 0
  i32.store
  i32.const 100
  i32.const 0
  i32.store
  i32.const 104
  i32.const 0
  i32.store
  i32.const 108
  i32.const 0
  i32.store
  i32.const 112
  i32.const 0
  i32.store
  i32.const 116
  i32.const 0
  i32.store
  i32.const 120
  i32.const 0
  i32.store
  i32.const 124
  i32.const 0
  i32.store
  i32.const 128
  i32.const 0
  i32.store
  i32.const 132
  i32.const 0
  i32.store
  i32.const 136
  i32.const 0
  i32.store
  i32.const 140
  i32.const 0
  i32.store
  i32.const 144
  i32.const 0
  i32.store
  i32.const 148
  i32.const 0
  i32.store
  i32.const 152
  i32.const 0
  i32.store
  i32.const 156
  i32.const 0
  i32.store
  i32.const 160
  i32.const 0
  i32.store
  i32.const 164
  i32.const 0
  i32.store
  i32.const 168
  i32.const 0
  i32.store
  i32.const 172
  i32.const 0
  i32.store
  i32.const 176
  i32.const 0
  i32.store
  i32.const 180
  i32.const 0
  i32.store
  i32.const 184
  i32.const 0
  i32.store
  i32.const 188
  i32.const 0
  i32.store
  i32.const 192
  i32.const 0
  i32.store
  i32.const 196
  i32.const 0
  i32.store
  i32.const 200
  i32.const 0
  i32.store
  i32.const 204
  i32.const 0
  i32.store
  i32.const 208
  i32.const 0
  i32.store
  i32.const 212
  i32.const 0
  i32.store
  i32.const 216
  i32.const 0
  i32.store
  i32.const 220
  i32.const 0
  i32.store
  i32.const 224
  i32.const 0
  i32.store
  i32.const 228
  i32.const 0
  i32.store
  i32.const 232
  i32.const 0
  i32.store
  i32.const 236
  i32.const 0
  i32.store
  i32.const 240
  i32.const 0
  i32.store
  i32.const 244
  i32.const 0
  i32.store
  i32.const 248
  i32.const 0
  i32.store
  i32.const 252
  i32.const 0
  i32.store
  i32.const 256
  i32.const 0
  i32.store
  i32.const 96
  f64.const 0.01
  f64.store
  i32.const 80
  f64.const 100
  f64.store
  i32.const 88
  f64.const 100
  f64.store
 )
 (func $src_wasm/assembly/combat/rotl<u64> (param $0 i64) (param $1 i32) (result i64)
  local.get $0
  local.get $1
  i64.extend_i32_s
  i64.shl
  local.get $0
  i64.const 32
  local.get $1
  i64.extend_i32_s
  i64.sub
  i64.shr_u
  i64.or
  return
 )
 (func $src_wasm/assembly/combat/rngNext (result i64)
  (local $0 i64)
  (local $1 i64)
  (local $2 i64)
  (local $3 i64)
  global.get $src_wasm/assembly/combat/_rng0
  local.set $0
  global.get $src_wasm/assembly/combat/_rng1
  local.set $1
  local.get $0
  i64.const 5
  i64.mul
  i32.const 7
  call $src_wasm/assembly/combat/rotl<u64>
  i64.const 9
  i64.mul
  local.set $2
  local.get $1
  local.get $0
  i64.xor
  local.set $3
  local.get $0
  i32.const 24
  call $src_wasm/assembly/combat/rotl<u64>
  local.get $3
  i64.xor
  local.get $3
  i64.const 16
  i64.shl
  i64.xor
  global.set $src_wasm/assembly/combat/_rng0
  local.get $3
  global.set $src_wasm/assembly/combat/_rng1
  local.get $2
  return
 )
 (func $src_wasm/assembly/combat/rngInt (param $0 i32) (result i32)
  call $src_wasm/assembly/combat/rngNext
  local.get $0
  i64.extend_i32_s
  i64.rem_u
  i32.wrap_i64
  return
 )
 (func $src_wasm/assembly/combat/floor (param $0 f64) (result f64)
  (local $1 f64)
  block $~lib/math/NativeMath.floor|inlined.0 (result f64)
   local.get $0
   local.set $1
   local.get $1
   f64.floor
   br $~lib/math/NativeMath.floor|inlined.0
  end
  return
 )
 (func $~lib/math/NativeMath.pow (param $0 f64) (param $1 f64) (result f64)
  (local $2 f64)
  (local $3 f64)
  (local $4 i32)
  (local $5 i64)
  (local $6 i64)
  (local $7 i64)
  (local $8 i64)
  (local $9 i64)
  (local $10 i64)
  (local $11 f64)
  (local $12 i64)
  (local $13 i64)
  (local $14 i64)
  (local $15 i64)
  (local $16 i32)
  (local $17 i64)
  (local $18 i64)
  (local $19 i32)
  (local $20 i64)
  (local $21 i64)
  (local $22 f64)
  (local $23 f64)
  (local $24 f64)
  (local $25 f64)
  (local $26 f64)
  (local $27 f64)
  (local $28 f64)
  (local $29 f64)
  (local $30 f64)
  (local $31 f64)
  (local $32 f64)
  (local $33 f64)
  (local $34 f64)
  (local $35 f64)
  (local $36 f64)
  (local $37 f64)
  (local $38 f64)
  (local $39 f64)
  (local $40 f64)
  (local $41 f64)
  (local $42 f64)
  (local $43 f64)
  (local $44 f64)
  (local $45 f64)
  (local $46 f64)
  (local $47 f64)
  (local $48 f64)
  (local $49 f64)
  (local $50 f64)
  (local $51 f64)
  (local $52 f64)
  (local $53 f64)
  (local $54 f64)
  (local $55 f64)
  (local $56 f64)
  (local $57 i32)
  (local $58 i32)
  (local $59 i64)
  (local $60 i64)
  (local $61 i64)
  (local $62 i32)
  (local $63 f64)
  (local $64 f64)
  (local $65 f64)
  (local $66 f64)
  (local $67 f64)
  (local $68 f64)
  (local $69 f64)
  (local $70 i64)
  (local $71 i32)
  (local $72 i32)
  (local $73 f64)
  (local $74 i32)
  (local $75 i32)
  (local $76 f64)
  (local $77 f64)
  (local $78 i64)
  (local $79 i64)
  (local $80 f64)
  (local $81 f64)
  (local $82 f64)
  (local $83 f64)
  (local $84 f64)
  local.get $1
  f64.abs
  f64.const 2
  f64.le
  if
   local.get $1
   f64.const 2
   f64.eq
   if
    local.get $0
    local.get $0
    f64.mul
    return
   end
   local.get $1
   f64.const 0.5
   f64.eq
   if
    local.get $0
    f64.sqrt
    f64.abs
    f64.const inf
    local.get $0
    f64.const inf
    f64.neg
    f64.ne
    select
    return
   end
   local.get $1
   f64.const -1
   f64.eq
   if
    f64.const 1
    local.get $0
    f64.div
    return
   end
   local.get $1
   f64.const 1
   f64.eq
   if
    local.get $0
    return
   end
   local.get $1
   f64.const 0
   f64.eq
   if
    f64.const 1
    return
   end
  end
  i32.const 0
  i32.const 1
  i32.lt_s
  drop
  block $~lib/util/math/pow_lut|inlined.0 (result f64)
   local.get $0
   local.set $2
   local.get $1
   local.set $3
   i32.const 0
   local.set $4
   local.get $2
   i64.reinterpret_f64
   local.set $5
   local.get $3
   i64.reinterpret_f64
   local.set $6
   local.get $5
   i64.const 52
   i64.shr_u
   local.set $7
   local.get $6
   i64.const 52
   i64.shr_u
   local.set $8
   local.get $7
   i64.const 1
   i64.sub
   i64.const 2047
   i64.const 1
   i64.sub
   i64.ge_u
   if (result i32)
    i32.const 1
   else
    local.get $8
    i64.const 2047
    i64.and
    i64.const 958
    i64.sub
    i64.const 1086
    i64.const 958
    i64.sub
    i64.ge_u
   end
   if
    block $~lib/util/math/zeroinfnan|inlined.0 (result i32)
     local.get $6
     local.set $9
     local.get $9
     i64.const 1
     i64.shl
     i64.const 1
     i64.sub
     i64.const -9007199254740992
     i64.const 1
     i64.sub
     i64.ge_u
     br $~lib/util/math/zeroinfnan|inlined.0
    end
    if
     local.get $6
     i64.const 1
     i64.shl
     i64.const 0
     i64.eq
     if
      f64.const 1
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $5
     i64.const 4607182418800017408
     i64.eq
     if
      f64.const nan:0x8000000000000
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $5
     i64.const 1
     i64.shl
     i64.const -9007199254740992
     i64.gt_u
     if (result i32)
      i32.const 1
     else
      local.get $6
      i64.const 1
      i64.shl
      i64.const -9007199254740992
      i64.gt_u
     end
     if
      local.get $2
      local.get $3
      f64.add
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $5
     i64.const 1
     i64.shl
     i64.const 9214364837600034816
     i64.eq
     if
      f64.const nan:0x8000000000000
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $5
     i64.const 1
     i64.shl
     i64.const 9214364837600034816
     i64.lt_u
     local.get $6
     i64.const 63
     i64.shr_u
     i64.const 0
     i64.ne
     i32.eqz
     i32.eq
     if
      f64.const 0
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $3
     local.get $3
     f64.mul
     br $~lib/util/math/pow_lut|inlined.0
    end
    block $~lib/util/math/zeroinfnan|inlined.1 (result i32)
     local.get $5
     local.set $10
     local.get $10
     i64.const 1
     i64.shl
     i64.const 1
     i64.sub
     i64.const -9007199254740992
     i64.const 1
     i64.sub
     i64.ge_u
     br $~lib/util/math/zeroinfnan|inlined.1
    end
    if
     local.get $2
     local.get $2
     f64.mul
     local.set $11
     local.get $5
     i64.const 63
     i64.shr_u
     i32.wrap_i64
     if (result i32)
      block $~lib/util/math/checkint|inlined.0 (result i32)
       local.get $6
       local.set $12
       local.get $12
       i64.const 52
       i64.shr_u
       i64.const 2047
       i64.and
       local.set $13
       local.get $13
       i64.const 1023
       i64.lt_u
       if
        i32.const 0
        br $~lib/util/math/checkint|inlined.0
       end
       local.get $13
       i64.const 1023
       i64.const 52
       i64.add
       i64.gt_u
       if
        i32.const 2
        br $~lib/util/math/checkint|inlined.0
       end
       i64.const 1
       i64.const 1023
       i64.const 52
       i64.add
       local.get $13
       i64.sub
       i64.shl
       local.set $13
       local.get $12
       local.get $13
       i64.const 1
       i64.sub
       i64.and
       i64.const 0
       i64.ne
       if
        i32.const 0
        br $~lib/util/math/checkint|inlined.0
       end
       local.get $12
       local.get $13
       i64.and
       i64.const 0
       i64.ne
       if
        i32.const 1
        br $~lib/util/math/checkint|inlined.0
       end
       i32.const 2
       br $~lib/util/math/checkint|inlined.0
      end
      i32.const 1
      i32.eq
     else
      i32.const 0
     end
     if
      local.get $11
      f64.neg
      local.set $11
     end
     local.get $6
     i64.const 0
     i64.lt_s
     if (result f64)
      f64.const 1
      local.get $11
      f64.div
     else
      local.get $11
     end
     br $~lib/util/math/pow_lut|inlined.0
    end
    local.get $5
    i64.const 0
    i64.lt_s
    if
     block $~lib/util/math/checkint|inlined.1 (result i32)
      local.get $6
      local.set $14
      local.get $14
      i64.const 52
      i64.shr_u
      i64.const 2047
      i64.and
      local.set $15
      local.get $15
      i64.const 1023
      i64.lt_u
      if
       i32.const 0
       br $~lib/util/math/checkint|inlined.1
      end
      local.get $15
      i64.const 1023
      i64.const 52
      i64.add
      i64.gt_u
      if
       i32.const 2
       br $~lib/util/math/checkint|inlined.1
      end
      i64.const 1
      i64.const 1023
      i64.const 52
      i64.add
      local.get $15
      i64.sub
      i64.shl
      local.set $15
      local.get $14
      local.get $15
      i64.const 1
      i64.sub
      i64.and
      i64.const 0
      i64.ne
      if
       i32.const 0
       br $~lib/util/math/checkint|inlined.1
      end
      local.get $14
      local.get $15
      i64.and
      i64.const 0
      i64.ne
      if
       i32.const 1
       br $~lib/util/math/checkint|inlined.1
      end
      i32.const 2
      br $~lib/util/math/checkint|inlined.1
     end
     local.set $16
     local.get $16
     i32.const 0
     i32.eq
     if
      local.get $2
      local.get $2
      f64.sub
      local.get $2
      local.get $2
      f64.sub
      f64.div
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $16
     i32.const 1
     i32.eq
     if
      i32.const 262144
      local.set $4
     end
     local.get $5
     i64.const 9223372036854775807
     i64.and
     local.set $5
     local.get $7
     i64.const 2047
     i64.and
     local.set $7
    end
    local.get $8
    i64.const 2047
    i64.and
    i64.const 958
    i64.sub
    i64.const 1086
    i64.const 958
    i64.sub
    i64.ge_u
    if
     local.get $5
     i64.const 4607182418800017408
     i64.eq
     if
      f64.const 1
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $8
     i64.const 2047
     i64.and
     i64.const 958
     i64.lt_u
     if
      f64.const 1
      br $~lib/util/math/pow_lut|inlined.0
     end
     local.get $5
     i64.const 4607182418800017408
     i64.gt_u
     local.get $8
     i64.const 2048
     i64.lt_u
     i32.eq
     if (result f64)
      f64.const inf
     else
      f64.const 0
     end
     br $~lib/util/math/pow_lut|inlined.0
    end
    local.get $7
    i64.const 0
    i64.eq
    if
     local.get $2
     f64.const 4503599627370496
     f64.mul
     i64.reinterpret_f64
     local.set $5
     local.get $5
     i64.const 9223372036854775807
     i64.and
     local.set $5
     local.get $5
     i64.const 52
     i64.const 52
     i64.shl
     i64.sub
     local.set $5
    end
   end
   block $~lib/util/math/log_inline|inlined.0 (result f64)
    local.get $5
    local.set $17
    local.get $17
    i64.const 4604531861337669632
    i64.sub
    local.set $18
    local.get $18
    i64.const 52
    i32.const 7
    i64.extend_i32_s
    i64.sub
    i64.shr_u
    i32.const 127
    i64.extend_i32_s
    i64.and
    i32.wrap_i64
    local.set $19
    local.get $18
    i64.const 52
    i64.shr_s
    local.set $20
    local.get $17
    local.get $18
    i64.const 4095
    i64.const 52
    i64.shl
    i64.and
    i64.sub
    local.set $21
    local.get $21
    f64.reinterpret_i64
    local.set $22
    local.get $20
    f64.convert_i64_s
    local.set $23
    i32.const 8
    local.get $19
    i32.const 2
    i32.const 3
    i32.add
    i32.shl
    i32.add
    f64.load
    local.set $24
    i32.const 8
    local.get $19
    i32.const 2
    i32.const 3
    i32.add
    i32.shl
    i32.add
    f64.load offset=16
    local.set $25
    i32.const 8
    local.get $19
    i32.const 2
    i32.const 3
    i32.add
    i32.shl
    i32.add
    f64.load offset=24
    local.set $26
    local.get $21
    i64.const 2147483648
    i64.add
    i64.const -4294967296
    i64.and
    f64.reinterpret_i64
    local.set $27
    local.get $22
    local.get $27
    f64.sub
    local.set $28
    local.get $27
    local.get $24
    f64.mul
    f64.const 1
    f64.sub
    local.set $29
    local.get $28
    local.get $24
    f64.mul
    local.set $30
    local.get $29
    local.get $30
    f64.add
    local.set $31
    local.get $23
    f64.const 0.6931471805598903
    f64.mul
    local.get $25
    f64.add
    local.set $32
    local.get $32
    local.get $31
    f64.add
    local.set $33
    local.get $23
    f64.const 5.497923018708371e-14
    f64.mul
    local.get $26
    f64.add
    local.set $34
    local.get $32
    local.get $33
    f64.sub
    local.get $31
    f64.add
    local.set $35
    f64.const -0.5
    local.get $31
    f64.mul
    local.set $36
    local.get $31
    local.get $36
    f64.mul
    local.set $37
    local.get $31
    local.get $37
    f64.mul
    local.set $38
    f64.const -0.5
    local.get $29
    f64.mul
    local.set $39
    local.get $29
    local.get $39
    f64.mul
    local.set $40
    local.get $33
    local.get $40
    f64.add
    local.set $41
    local.get $30
    local.get $36
    local.get $39
    f64.add
    f64.mul
    local.set $42
    local.get $33
    local.get $41
    f64.sub
    local.get $40
    f64.add
    local.set $43
    local.get $38
    f64.const -0.6666666666666679
    local.get $31
    f64.const 0.5000000000000007
    f64.mul
    f64.add
    local.get $37
    f64.const 0.7999999995323976
    local.get $31
    f64.const -0.6666666663487739
    f64.mul
    f64.add
    local.get $37
    f64.const -1.142909628459501
    local.get $31
    f64.const 1.0000415263675542
    f64.mul
    f64.add
    f64.mul
    f64.add
    f64.mul
    f64.add
    f64.mul
    local.set $44
    local.get $34
    local.get $35
    f64.add
    local.get $42
    f64.add
    local.get $43
    f64.add
    local.get $44
    f64.add
    local.set $45
    local.get $41
    local.get $45
    f64.add
    local.set $46
    local.get $41
    local.get $46
    f64.sub
    local.get $45
    f64.add
    global.set $~lib/util/math/log_tail
    local.get $46
    br $~lib/util/math/log_inline|inlined.0
   end
   local.set $47
   global.get $~lib/util/math/log_tail
   local.set $48
   local.get $6
   i64.const -134217728
   i64.and
   f64.reinterpret_i64
   local.set $51
   local.get $3
   local.get $51
   f64.sub
   local.set $52
   local.get $47
   i64.reinterpret_f64
   i64.const -134217728
   i64.and
   f64.reinterpret_i64
   local.set $53
   local.get $47
   local.get $53
   f64.sub
   local.get $48
   f64.add
   local.set $54
   local.get $51
   local.get $53
   f64.mul
   local.set $49
   local.get $52
   local.get $53
   f64.mul
   local.get $3
   local.get $54
   f64.mul
   f64.add
   local.set $50
   block $~lib/util/math/exp_inline|inlined.0 (result f64)
    local.get $49
    local.set $55
    local.get $50
    local.set $56
    local.get $4
    local.set $57
    local.get $55
    i64.reinterpret_f64
    local.set $70
    local.get $70
    i64.const 52
    i64.shr_u
    i32.wrap_i64
    i32.const 2047
    i32.and
    local.set $58
    local.get $58
    i32.const 969
    i32.sub
    i32.const 63
    i32.ge_u
    if
     local.get $58
     i32.const 969
     i32.sub
     i32.const -2147483648
     i32.ge_u
     if
      f64.const -1
      f64.const 1
      local.get $57
      select
      br $~lib/util/math/exp_inline|inlined.0
     end
     local.get $58
     i32.const 1033
     i32.ge_u
     if
      local.get $70
      i64.const 0
      i64.lt_s
      if (result f64)
       block $~lib/util/math/uflow|inlined.0 (result f64)
        local.get $57
        local.set $71
        block $~lib/util/math/xflow|inlined.0 (result f64)
         local.get $71
         local.set $72
         i64.const 1152921504606846976
         f64.reinterpret_i64
         local.set $73
         local.get $73
         f64.neg
         local.get $73
         local.get $72
         select
         local.get $73
         f64.mul
         br $~lib/util/math/xflow|inlined.0
        end
        br $~lib/util/math/uflow|inlined.0
       end
      else
       block $~lib/util/math/oflow|inlined.0 (result f64)
        local.get $57
        local.set $74
        block $~lib/util/math/xflow|inlined.1 (result f64)
         local.get $74
         local.set $75
         i64.const 8070450532247928832
         f64.reinterpret_i64
         local.set $76
         local.get $76
         f64.neg
         local.get $76
         local.get $75
         select
         local.get $76
         f64.mul
         br $~lib/util/math/xflow|inlined.1
        end
        br $~lib/util/math/oflow|inlined.0
       end
      end
      br $~lib/util/math/exp_inline|inlined.0
     end
     i32.const 0
     local.set $58
    end
    f64.const 184.6649652337873
    local.get $55
    f64.mul
    local.set $64
    local.get $64
    f64.const 6755399441055744
    f64.add
    local.set $63
    local.get $63
    i64.reinterpret_f64
    local.set $59
    local.get $63
    f64.const 6755399441055744
    f64.sub
    local.set $63
    local.get $55
    local.get $63
    f64.const -0.005415212348111709
    f64.mul
    f64.add
    local.get $63
    f64.const -1.2864023111638346e-14
    f64.mul
    f64.add
    local.set $65
    local.get $65
    local.get $56
    f64.add
    local.set $65
    local.get $59
    i32.const 127
    i64.extend_i32_s
    i64.and
    i64.const 1
    i64.shl
    i32.wrap_i64
    local.set $62
    local.get $59
    local.get $57
    i64.extend_i32_u
    i64.add
    i64.const 52
    i32.const 7
    i64.extend_i32_s
    i64.sub
    i64.shl
    local.set $60
    i32.const 4104
    local.get $62
    i32.const 3
    i32.shl
    i32.add
    i64.load
    f64.reinterpret_i64
    local.set $68
    i32.const 4104
    local.get $62
    i32.const 3
    i32.shl
    i32.add
    i64.load offset=8
    local.get $60
    i64.add
    local.set $61
    local.get $65
    local.get $65
    f64.mul
    local.set $66
    local.get $68
    local.get $65
    f64.add
    local.get $66
    f64.const 0.49999999999996786
    local.get $65
    f64.const 0.16666666666665886
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.get $66
    local.get $66
    f64.mul
    f64.const 0.0416666808410674
    local.get $65
    f64.const 0.008333335853059549
    f64.mul
    f64.add
    f64.mul
    f64.add
    local.set $69
    local.get $58
    i32.const 0
    i32.eq
    if
     block $~lib/util/math/specialcase|inlined.0 (result f64)
      local.get $69
      local.set $77
      local.get $61
      local.set $78
      local.get $59
      local.set $79
      local.get $79
      i64.const 2147483648
      i64.and
      i64.const 0
      i64.ne
      i32.eqz
      if
       local.get $78
       i64.const 1009
       i64.const 52
       i64.shl
       i64.sub
       local.set $78
       local.get $78
       f64.reinterpret_i64
       local.set $80
       f64.const 5486124068793688683255936e279
       local.get $80
       local.get $80
       local.get $77
       f64.mul
       f64.add
       f64.mul
       br $~lib/util/math/specialcase|inlined.0
      end
      local.get $78
      i64.const 1022
      i64.const 52
      i64.shl
      i64.add
      local.set $78
      local.get $78
      f64.reinterpret_i64
      local.set $80
      local.get $80
      local.get $80
      local.get $77
      f64.mul
      f64.add
      local.set $81
      local.get $81
      f64.abs
      f64.const 1
      f64.lt
      if
       f64.const 1
       local.get $81
       f64.copysign
       local.set $82
       local.get $80
       local.get $81
       f64.sub
       local.get $80
       local.get $77
       f64.mul
       f64.add
       local.set $83
       local.get $82
       local.get $81
       f64.add
       local.set $84
       local.get $82
       local.get $84
       f64.sub
       local.get $81
       f64.add
       local.get $83
       f64.add
       local.set $83
       local.get $84
       local.get $83
       f64.add
       local.get $82
       f64.sub
       local.set $81
       local.get $81
       f64.const 0
       f64.eq
       if
        local.get $78
        i64.const -9223372036854775808
        i64.and
        f64.reinterpret_i64
        local.set $81
       end
      end
      local.get $81
      f64.const 2.2250738585072014e-308
      f64.mul
      br $~lib/util/math/specialcase|inlined.0
     end
     br $~lib/util/math/exp_inline|inlined.0
    end
    local.get $61
    f64.reinterpret_i64
    local.set $67
    local.get $67
    local.get $67
    local.get $69
    f64.mul
    f64.add
    br $~lib/util/math/exp_inline|inlined.0
   end
   br $~lib/util/math/pow_lut|inlined.0
  end
  return
 )
 (func $src_wasm/assembly/combat/wasmPow (param $0 f64) (param $1 f64) (result f64)
  (local $2 f64)
  (local $3 i32)
  local.get $1
  f64.const 0
  f64.eq
  if
   f64.const 1
   return
  end
  local.get $0
  f64.const 0
  f64.eq
  if
   f64.const 0
   return
  end
  local.get $1
  f64.const 1
  f64.eq
  if
   local.get $0
   return
  end
  local.get $1
  local.get $1
  call $src_wasm/assembly/combat/floor
  f64.eq
  if
   f64.const 1
   local.set $2
   local.get $1
   i32.trunc_sat_f64_s
   local.set $3
   local.get $3
   i32.const 0
   i32.lt_s
   if
    f64.const 1
    local.get $0
    f64.div
    local.set $0
    i32.const 0
    local.get $3
    i32.sub
    local.set $3
   end
   loop $while-continue|0
    local.get $3
    i32.const 0
    i32.gt_s
    if
     local.get $3
     i32.const 1
     i32.and
     i32.const 0
     i32.ne
     if
      local.get $2
      local.get $0
      f64.mul
      local.set $2
     end
     local.get $0
     local.get $0
     f64.mul
     local.set $0
     local.get $3
     i32.const 1
     i32.shr_s
     local.set $3
     br $while-continue|0
    end
   end
   local.get $2
   return
  end
  local.get $0
  local.get $1
  call $~lib/math/NativeMath.pow
  return
 )
 (func $src_wasm/assembly/combat/combat_spawnEnemy (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 f64)
  (local $4 f64)
  (local $5 f64)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  local.get $0
  i32.const 5
  call $src_wasm/assembly/combat/rngInt
  i32.add
  i32.const 2
  i32.sub
  local.set $1
  local.get $1
  i32.const 0
  i32.gt_s
  if (result i32)
   local.get $1
  else
   i32.const 1
  end
  local.set $2
  f64.const 1.15
  local.get $2
  f64.convert_i32_s
  call $src_wasm/assembly/combat/wasmPow
  local.set $3
  f64.const 50
  local.get $3
  f64.mul
  local.set $4
  f64.const 1.12
  local.get $2
  f64.convert_i32_s
  call $src_wasm/assembly/combat/wasmPow
  local.set $5
  f64.const 5
  local.get $5
  f64.mul
  local.set $6
  f64.const 1.1
  local.get $2
  f64.convert_i32_s
  call $src_wasm/assembly/combat/wasmPow
  local.set $7
  f64.const 2
  local.get $7
  f64.mul
  local.set $8
  global.get $src_wasm/assembly/combat/OFF_ENEMY_HP
  local.get $4
  f64.store
  global.get $src_wasm/assembly/combat/OFF_ENEMY_MAX_HP
  local.get $4
  f64.store
  global.get $src_wasm/assembly/combat/OFF_ENEMY_ATK
  local.get $6
  f64.store
  global.get $src_wasm/assembly/combat/OFF_ENEMY_DEF
  local.get $8
  f64.store
  global.get $src_wasm/assembly/combat/OFF_ENEMY_LEVEL
  local.get $2
  i32.store
  global.get $src_wasm/assembly/combat/OFF_COMBAT_ACTIVE
  i32.const 1
  i32.store
  i32.const 1
  return
 )
 (func $src_wasm/assembly/index/init
  call $src_wasm/assembly/ecs/world_init
  i32.const 1
  call $src_wasm/assembly/combat/combat_spawnEnemy
  drop
 )
 (func $src_wasm/assembly/decimal/wasmAbs (param $0 f64) (result f64)
  (local $1 f64)
  block $~lib/math/NativeMath.abs|inlined.0 (result f64)
   local.get $0
   local.set $1
   local.get $1
   f64.abs
   br $~lib/math/NativeMath.abs|inlined.0
  end
  return
 )
 (func $~lib/rt/itcms/Object#set:nextWithColor (param $0 i32) (param $1 i32)
  local.get $0
  local.get $1
  i32.store offset=4
 )
 (func $~lib/rt/itcms/Object#set:prev (param $0 i32) (param $1 i32)
  local.get $0
  local.get $1
  i32.store offset=8
 )
 (func $~lib/rt/itcms/initLazy (param $0 i32) (result i32)
  local.get $0
  local.get $0
  call $~lib/rt/itcms/Object#set:nextWithColor
  local.get $0
  local.get $0
  call $~lib/rt/itcms/Object#set:prev
  local.get $0
  return
 )
 (func $~lib/rt/itcms/Object#get:nextWithColor (param $0 i32) (result i32)
  local.get $0
  i32.load offset=4
 )
 (func $~lib/rt/itcms/Object#get:next (param $0 i32) (result i32)
  local.get $0
  call $~lib/rt/itcms/Object#get:nextWithColor
  i32.const 3
  i32.const -1
  i32.xor
  i32.and
  return
 )
 (func $~lib/rt/itcms/Object#get:color (param $0 i32) (result i32)
  local.get $0
  call $~lib/rt/itcms/Object#get:nextWithColor
  i32.const 3
  i32.and
  return
 )
 (func $~lib/rt/itcms/visitRoots (param $0 i32)
  (local $1 i32)
  (local $2 i32)
  local.get $0
  call $~lib/rt/__visit_globals
  global.get $~lib/rt/itcms/pinSpace
  local.set $1
  local.get $1
  call $~lib/rt/itcms/Object#get:next
  local.set $2
  loop $while-continue|0
   local.get $2
   local.get $1
   i32.ne
   if
    i32.const 1
    drop
    local.get $2
    call $~lib/rt/itcms/Object#get:color
    i32.const 3
    i32.eq
    i32.eqz
    if
     i32.const 0
     i32.const 6240
     i32.const 160
     i32.const 16
     call $~lib/builtins/abort
     unreachable
    end
    local.get $2
    i32.const 20
    i32.add
    local.get $0
    call $~lib/rt/__visit_members
    local.get $2
    call $~lib/rt/itcms/Object#get:next
    local.set $2
    br $while-continue|0
   end
  end
 )
 (func $~lib/rt/itcms/Object#set:color (param $0 i32) (param $1 i32)
  local.get $0
  local.get $0
  call $~lib/rt/itcms/Object#get:nextWithColor
  i32.const 3
  i32.const -1
  i32.xor
  i32.and
  local.get $1
  i32.or
  call $~lib/rt/itcms/Object#set:nextWithColor
 )
 (func $~lib/rt/itcms/Object#get:prev (param $0 i32) (result i32)
  local.get $0
  i32.load offset=8
 )
 (func $~lib/rt/itcms/Object#set:next (param $0 i32) (param $1 i32)
  local.get $0
  local.get $1
  local.get $0
  call $~lib/rt/itcms/Object#get:nextWithColor
  i32.const 3
  i32.and
  i32.or
  call $~lib/rt/itcms/Object#set:nextWithColor
 )
 (func $~lib/rt/itcms/Object#unlink (param $0 i32)
  (local $1 i32)
  (local $2 i32)
  local.get $0
  call $~lib/rt/itcms/Object#get:next
  local.set $1
  local.get $1
  i32.const 0
  i32.eq
  if
   i32.const 1
   drop
   local.get $0
   call $~lib/rt/itcms/Object#get:prev
   i32.const 0
   i32.eq
   if (result i32)
    local.get $0
    global.get $~lib/memory/__heap_base
    i32.lt_u
   else
    i32.const 0
   end
   i32.eqz
   if
    i32.const 0
    i32.const 6240
    i32.const 128
    i32.const 18
    call $~lib/builtins/abort
    unreachable
   end
   return
  end
  local.get $0
  call $~lib/rt/itcms/Object#get:prev
  local.set $2
  i32.const 1
  drop
  local.get $2
  i32.eqz
  if
   i32.const 0
   i32.const 6240
   i32.const 132
   i32.const 16
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  local.get $2
  call $~lib/rt/itcms/Object#set:prev
  local.get $2
  local.get $1
  call $~lib/rt/itcms/Object#set:next
 )
 (func $~lib/rt/itcms/Object#get:rtId (param $0 i32) (result i32)
  local.get $0
  i32.load offset=12
 )
 (func $~lib/shared/typeinfo/Typeinfo#get:flags (param $0 i32) (result i32)
  local.get $0
  i32.load
 )
 (func $~lib/rt/__typeinfo (param $0 i32) (result i32)
  (local $1 i32)
  global.get $~lib/rt/__rtti_base
  local.set $1
  local.get $0
  local.get $1
  i32.load
  i32.gt_u
  if
   i32.const 6368
   i32.const 6432
   i32.const 21
   i32.const 28
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  i32.const 4
  i32.add
  local.get $0
  i32.const 4
  i32.mul
  i32.add
  call $~lib/shared/typeinfo/Typeinfo#get:flags
  return
 )
 (func $~lib/rt/itcms/Object#get:isPointerfree (param $0 i32) (result i32)
  (local $1 i32)
  local.get $0
  call $~lib/rt/itcms/Object#get:rtId
  local.set $1
  local.get $1
  i32.const 2
  i32.le_u
  if (result i32)
   i32.const 1
  else
   local.get $1
   call $~lib/rt/__typeinfo
   i32.const 32
   i32.and
   i32.const 0
   i32.ne
  end
  return
 )
 (func $~lib/rt/itcms/Object#linkTo (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 i32)
  local.get $1
  call $~lib/rt/itcms/Object#get:prev
  local.set $3
  local.get $0
  local.get $1
  local.get $2
  i32.or
  call $~lib/rt/itcms/Object#set:nextWithColor
  local.get $0
  local.get $3
  call $~lib/rt/itcms/Object#set:prev
  local.get $3
  local.get $0
  call $~lib/rt/itcms/Object#set:next
  local.get $1
  local.get $0
  call $~lib/rt/itcms/Object#set:prev
 )
 (func $~lib/rt/itcms/Object#makeGray (param $0 i32)
  (local $1 i32)
  local.get $0
  global.get $~lib/rt/itcms/iter
  i32.eq
  if
   local.get $0
   call $~lib/rt/itcms/Object#get:prev
   local.tee $1
   i32.eqz
   if (result i32)
    i32.const 0
    i32.const 6240
    i32.const 148
    i32.const 30
    call $~lib/builtins/abort
    unreachable
   else
    local.get $1
   end
   global.set $~lib/rt/itcms/iter
  end
  local.get $0
  call $~lib/rt/itcms/Object#unlink
  local.get $0
  global.get $~lib/rt/itcms/toSpace
  local.get $0
  call $~lib/rt/itcms/Object#get:isPointerfree
  if (result i32)
   global.get $~lib/rt/itcms/white
   i32.eqz
  else
   i32.const 2
  end
  call $~lib/rt/itcms/Object#linkTo
 )
 (func $~lib/rt/itcms/__visit (param $0 i32) (param $1 i32)
  (local $2 i32)
  local.get $0
  i32.eqz
  if
   return
  end
  local.get $0
  i32.const 20
  i32.sub
  local.set $2
  i32.const 0
  drop
  local.get $2
  call $~lib/rt/itcms/Object#get:color
  global.get $~lib/rt/itcms/white
  i32.eq
  if
   local.get $2
   call $~lib/rt/itcms/Object#makeGray
   global.get $~lib/rt/itcms/visitCount
   i32.const 1
   i32.add
   global.set $~lib/rt/itcms/visitCount
  end
 )
 (func $~lib/rt/itcms/visitStack (param $0 i32)
  (local $1 i32)
  global.get $~lib/memory/__stack_pointer
  local.set $1
  loop $while-continue|0
   local.get $1
   global.get $~lib/memory/__heap_base
   i32.lt_u
   if
    local.get $1
    i32.load
    local.get $0
    call $~lib/rt/itcms/__visit
    local.get $1
    i32.const 4
    i32.add
    local.set $1
    br $while-continue|0
   end
  end
 )
 (func $~lib/rt/common/BLOCK#get:mmInfo (param $0 i32) (result i32)
  local.get $0
  i32.load
 )
 (func $~lib/rt/itcms/Object#get:size (param $0 i32) (result i32)
  i32.const 4
  local.get $0
  call $~lib/rt/common/BLOCK#get:mmInfo
  i32.const 3
  i32.const -1
  i32.xor
  i32.and
  i32.add
  return
 )
 (func $~lib/rt/tlsf/Root#set:flMap (param $0 i32) (param $1 i32)
  local.get $0
  local.get $1
  i32.store
 )
 (func $~lib/rt/common/BLOCK#set:mmInfo (param $0 i32) (param $1 i32)
  local.get $0
  local.get $1
  i32.store
 )
 (func $~lib/rt/tlsf/Block#set:prev (param $0 i32) (param $1 i32)
  local.get $0
  local.get $1
  i32.store offset=4
 )
 (func $~lib/rt/tlsf/Block#set:next (param $0 i32) (param $1 i32)
  local.get $0
  local.get $1
  i32.store offset=8
 )
 (func $~lib/rt/tlsf/Block#get:prev (param $0 i32) (result i32)
  local.get $0
  i32.load offset=4
 )
 (func $~lib/rt/tlsf/Block#get:next (param $0 i32) (result i32)
  local.get $0
  i32.load offset=8
 )
 (func $~lib/rt/tlsf/Root#get:flMap (param $0 i32) (result i32)
  local.get $0
  i32.load
 )
 (func $~lib/rt/tlsf/removeBlock (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  (local $14 i32)
  (local $15 i32)
  (local $16 i32)
  (local $17 i32)
  (local $18 i32)
  (local $19 i32)
  (local $20 i32)
  (local $21 i32)
  (local $22 i32)
  (local $23 i32)
  local.get $1
  call $~lib/rt/common/BLOCK#get:mmInfo
  local.set $2
  i32.const 1
  drop
  local.get $2
  i32.const 1
  i32.and
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 268
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $2
  i32.const 3
  i32.const -1
  i32.xor
  i32.and
  local.set $3
  i32.const 1
  drop
  local.get $3
  i32.const 12
  i32.ge_u
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 270
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $3
  i32.const 256
  i32.lt_u
  if
   i32.const 0
   local.set $4
   local.get $3
   i32.const 4
   i32.shr_u
   local.set $5
  else
   local.get $3
   local.tee $6
   i32.const 1073741820
   local.tee $7
   local.get $6
   local.get $7
   i32.lt_u
   select
   local.set $8
   i32.const 31
   local.get $8
   i32.clz
   i32.sub
   local.set $4
   local.get $8
   local.get $4
   i32.const 4
   i32.sub
   i32.shr_u
   i32.const 1
   i32.const 4
   i32.shl
   i32.xor
   local.set $5
   local.get $4
   i32.const 8
   i32.const 1
   i32.sub
   i32.sub
   local.set $4
  end
  i32.const 1
  drop
  local.get $4
  i32.const 23
  i32.lt_u
  if (result i32)
   local.get $5
   i32.const 16
   i32.lt_u
  else
   i32.const 0
  end
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 284
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  call $~lib/rt/tlsf/Block#get:prev
  local.set $9
  local.get $1
  call $~lib/rt/tlsf/Block#get:next
  local.set $10
  local.get $9
  if
   local.get $9
   local.get $10
   call $~lib/rt/tlsf/Block#set:next
  end
  local.get $10
  if
   local.get $10
   local.get $9
   call $~lib/rt/tlsf/Block#set:prev
  end
  local.get $1
  block $~lib/rt/tlsf/GETHEAD|inlined.0 (result i32)
   local.get $0
   local.set $11
   local.get $4
   local.set $12
   local.get $5
   local.set $13
   local.get $11
   local.get $12
   i32.const 4
   i32.shl
   local.get $13
   i32.add
   i32.const 2
   i32.shl
   i32.add
   i32.load offset=96
   br $~lib/rt/tlsf/GETHEAD|inlined.0
  end
  i32.eq
  if
   local.get $0
   local.set $14
   local.get $4
   local.set $15
   local.get $5
   local.set $16
   local.get $10
   local.set $17
   local.get $14
   local.get $15
   i32.const 4
   i32.shl
   local.get $16
   i32.add
   i32.const 2
   i32.shl
   i32.add
   local.get $17
   i32.store offset=96
   local.get $10
   i32.eqz
   if
    block $~lib/rt/tlsf/GETSL|inlined.0 (result i32)
     local.get $0
     local.set $18
     local.get $4
     local.set $19
     local.get $18
     local.get $19
     i32.const 2
     i32.shl
     i32.add
     i32.load offset=4
     br $~lib/rt/tlsf/GETSL|inlined.0
    end
    local.set $20
    local.get $0
    local.set $21
    local.get $4
    local.set $22
    local.get $20
    i32.const 1
    local.get $5
    i32.shl
    i32.const -1
    i32.xor
    i32.and
    local.tee $20
    local.set $23
    local.get $21
    local.get $22
    i32.const 2
    i32.shl
    i32.add
    local.get $23
    i32.store offset=4
    local.get $20
    i32.eqz
    if
     local.get $0
     local.get $0
     call $~lib/rt/tlsf/Root#get:flMap
     i32.const 1
     local.get $4
     i32.shl
     i32.const -1
     i32.xor
     i32.and
     call $~lib/rt/tlsf/Root#set:flMap
    end
   end
  end
 )
 (func $~lib/rt/tlsf/insertBlock (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  (local $14 i32)
  (local $15 i32)
  (local $16 i32)
  (local $17 i32)
  (local $18 i32)
  (local $19 i32)
  (local $20 i32)
  (local $21 i32)
  (local $22 i32)
  (local $23 i32)
  (local $24 i32)
  (local $25 i32)
  (local $26 i32)
  (local $27 i32)
  (local $28 i32)
  i32.const 1
  drop
  local.get $1
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 201
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  call $~lib/rt/common/BLOCK#get:mmInfo
  local.set $2
  i32.const 1
  drop
  local.get $2
  i32.const 1
  i32.and
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 203
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  block $~lib/rt/tlsf/GETRIGHT|inlined.0 (result i32)
   local.get $1
   local.set $3
   local.get $3
   i32.const 4
   i32.add
   local.get $3
   call $~lib/rt/common/BLOCK#get:mmInfo
   i32.const 3
   i32.const -1
   i32.xor
   i32.and
   i32.add
   br $~lib/rt/tlsf/GETRIGHT|inlined.0
  end
  local.set $4
  local.get $4
  call $~lib/rt/common/BLOCK#get:mmInfo
  local.set $5
  local.get $5
  i32.const 1
  i32.and
  if
   local.get $0
   local.get $4
   call $~lib/rt/tlsf/removeBlock
   local.get $1
   local.get $2
   i32.const 4
   i32.add
   local.get $5
   i32.const 3
   i32.const -1
   i32.xor
   i32.and
   i32.add
   local.tee $2
   call $~lib/rt/common/BLOCK#set:mmInfo
   block $~lib/rt/tlsf/GETRIGHT|inlined.1 (result i32)
    local.get $1
    local.set $6
    local.get $6
    i32.const 4
    i32.add
    local.get $6
    call $~lib/rt/common/BLOCK#get:mmInfo
    i32.const 3
    i32.const -1
    i32.xor
    i32.and
    i32.add
    br $~lib/rt/tlsf/GETRIGHT|inlined.1
   end
   local.set $4
   local.get $4
   call $~lib/rt/common/BLOCK#get:mmInfo
   local.set $5
  end
  local.get $2
  i32.const 2
  i32.and
  if
   block $~lib/rt/tlsf/GETFREELEFT|inlined.0 (result i32)
    local.get $1
    local.set $7
    local.get $7
    i32.const 4
    i32.sub
    i32.load
    br $~lib/rt/tlsf/GETFREELEFT|inlined.0
   end
   local.set $8
   local.get $8
   call $~lib/rt/common/BLOCK#get:mmInfo
   local.set $9
   i32.const 1
   drop
   local.get $9
   i32.const 1
   i32.and
   i32.eqz
   if
    i32.const 0
    i32.const 6512
    i32.const 221
    i32.const 16
    call $~lib/builtins/abort
    unreachable
   end
   local.get $0
   local.get $8
   call $~lib/rt/tlsf/removeBlock
   local.get $8
   local.set $1
   local.get $1
   local.get $9
   i32.const 4
   i32.add
   local.get $2
   i32.const 3
   i32.const -1
   i32.xor
   i32.and
   i32.add
   local.tee $2
   call $~lib/rt/common/BLOCK#set:mmInfo
  end
  local.get $4
  local.get $5
  i32.const 2
  i32.or
  call $~lib/rt/common/BLOCK#set:mmInfo
  local.get $2
  i32.const 3
  i32.const -1
  i32.xor
  i32.and
  local.set $10
  i32.const 1
  drop
  local.get $10
  i32.const 12
  i32.ge_u
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 233
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  i32.const 1
  drop
  local.get $1
  i32.const 4
  i32.add
  local.get $10
  i32.add
  local.get $4
  i32.eq
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 234
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $4
  i32.const 4
  i32.sub
  local.get $1
  i32.store
  local.get $10
  i32.const 256
  i32.lt_u
  if
   i32.const 0
   local.set $11
   local.get $10
   i32.const 4
   i32.shr_u
   local.set $12
  else
   local.get $10
   local.tee $13
   i32.const 1073741820
   local.tee $14
   local.get $13
   local.get $14
   i32.lt_u
   select
   local.set $15
   i32.const 31
   local.get $15
   i32.clz
   i32.sub
   local.set $11
   local.get $15
   local.get $11
   i32.const 4
   i32.sub
   i32.shr_u
   i32.const 1
   i32.const 4
   i32.shl
   i32.xor
   local.set $12
   local.get $11
   i32.const 8
   i32.const 1
   i32.sub
   i32.sub
   local.set $11
  end
  i32.const 1
  drop
  local.get $11
  i32.const 23
  i32.lt_u
  if (result i32)
   local.get $12
   i32.const 16
   i32.lt_u
  else
   i32.const 0
  end
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 251
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  block $~lib/rt/tlsf/GETHEAD|inlined.1 (result i32)
   local.get $0
   local.set $16
   local.get $11
   local.set $17
   local.get $12
   local.set $18
   local.get $16
   local.get $17
   i32.const 4
   i32.shl
   local.get $18
   i32.add
   i32.const 2
   i32.shl
   i32.add
   i32.load offset=96
   br $~lib/rt/tlsf/GETHEAD|inlined.1
  end
  local.set $19
  local.get $1
  i32.const 0
  call $~lib/rt/tlsf/Block#set:prev
  local.get $1
  local.get $19
  call $~lib/rt/tlsf/Block#set:next
  local.get $19
  if
   local.get $19
   local.get $1
   call $~lib/rt/tlsf/Block#set:prev
  end
  local.get $0
  local.set $20
  local.get $11
  local.set $21
  local.get $12
  local.set $22
  local.get $1
  local.set $23
  local.get $20
  local.get $21
  i32.const 4
  i32.shl
  local.get $22
  i32.add
  i32.const 2
  i32.shl
  i32.add
  local.get $23
  i32.store offset=96
  local.get $0
  local.get $0
  call $~lib/rt/tlsf/Root#get:flMap
  i32.const 1
  local.get $11
  i32.shl
  i32.or
  call $~lib/rt/tlsf/Root#set:flMap
  local.get $0
  local.set $26
  local.get $11
  local.set $27
  block $~lib/rt/tlsf/GETSL|inlined.1 (result i32)
   local.get $0
   local.set $24
   local.get $11
   local.set $25
   local.get $24
   local.get $25
   i32.const 2
   i32.shl
   i32.add
   i32.load offset=4
   br $~lib/rt/tlsf/GETSL|inlined.1
  end
  i32.const 1
  local.get $12
  i32.shl
  i32.or
  local.set $28
  local.get $26
  local.get $27
  i32.const 2
  i32.shl
  i32.add
  local.get $28
  i32.store offset=4
 )
 (func $~lib/rt/tlsf/addMemory (param $0 i32) (param $1 i32) (param $2 i64) (result i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  local.get $2
  i32.wrap_i64
  local.set $3
  i32.const 1
  drop
  local.get $1
  i64.extend_i32_u
  local.get $2
  i64.le_u
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 382
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  i32.const 4
  i32.add
  i32.const 15
  i32.add
  i32.const 15
  i32.const -1
  i32.xor
  i32.and
  i32.const 4
  i32.sub
  local.set $1
  local.get $3
  i32.const 15
  i32.const -1
  i32.xor
  i32.and
  local.set $3
  block $~lib/rt/tlsf/GETTAIL|inlined.0 (result i32)
   local.get $0
   local.set $4
   local.get $4
   i32.load offset=1568
   br $~lib/rt/tlsf/GETTAIL|inlined.0
  end
  local.set $5
  i32.const 0
  local.set $6
  local.get $5
  if
   i32.const 1
   drop
   local.get $1
   local.get $5
   i32.const 4
   i32.add
   i32.ge_u
   i32.eqz
   if
    i32.const 0
    i32.const 6512
    i32.const 389
    i32.const 16
    call $~lib/builtins/abort
    unreachable
   end
   local.get $1
   i32.const 16
   i32.sub
   local.get $5
   i32.eq
   if
    local.get $1
    i32.const 16
    i32.sub
    local.set $1
    local.get $5
    call $~lib/rt/common/BLOCK#get:mmInfo
    local.set $6
   else
   end
  else
   i32.const 1
   drop
   local.get $1
   local.get $0
   i32.const 1572
   i32.add
   i32.ge_u
   i32.eqz
   if
    i32.const 0
    i32.const 6512
    i32.const 402
    i32.const 5
    call $~lib/builtins/abort
    unreachable
   end
  end
  local.get $3
  local.get $1
  i32.sub
  local.set $7
  local.get $7
  i32.const 4
  i32.const 12
  i32.add
  i32.const 4
  i32.add
  i32.lt_u
  if
   i32.const 0
   return
  end
  local.get $7
  i32.const 2
  i32.const 4
  i32.mul
  i32.sub
  local.set $8
  local.get $1
  local.set $9
  local.get $9
  local.get $8
  i32.const 1
  i32.or
  local.get $6
  i32.const 2
  i32.and
  i32.or
  call $~lib/rt/common/BLOCK#set:mmInfo
  local.get $9
  i32.const 0
  call $~lib/rt/tlsf/Block#set:prev
  local.get $9
  i32.const 0
  call $~lib/rt/tlsf/Block#set:next
  local.get $1
  i32.const 4
  i32.add
  local.get $8
  i32.add
  local.set $5
  local.get $5
  i32.const 0
  i32.const 2
  i32.or
  call $~lib/rt/common/BLOCK#set:mmInfo
  local.get $0
  local.set $10
  local.get $5
  local.set $11
  local.get $10
  local.get $11
  i32.store offset=1568
  local.get $0
  local.get $9
  call $~lib/rt/tlsf/insertBlock
  i32.const 1
  return
 )
 (func $~lib/rt/tlsf/initialize
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  (local $14 i32)
  (local $15 i32)
  i32.const 0
  drop
  global.get $~lib/memory/__heap_base
  i32.const 15
  i32.add
  i32.const 15
  i32.const -1
  i32.xor
  i32.and
  local.set $0
  memory.size
  local.set $1
  local.get $0
  i32.const 1572
  i32.add
  i32.const 65535
  i32.add
  i32.const 65535
  i32.const -1
  i32.xor
  i32.and
  i32.const 16
  i32.shr_u
  local.set $2
  local.get $2
  local.get $1
  i32.gt_s
  if (result i32)
   local.get $2
   local.get $1
   i32.sub
   memory.grow
   i32.const 0
   i32.lt_s
  else
   i32.const 0
  end
  if
   unreachable
  end
  local.get $0
  local.set $3
  local.get $3
  i32.const 0
  call $~lib/rt/tlsf/Root#set:flMap
  local.get $3
  local.set $4
  i32.const 0
  local.set $5
  local.get $4
  local.get $5
  i32.store offset=1568
  i32.const 0
  local.set $6
  loop $for-loop|0
   local.get $6
   i32.const 23
   i32.lt_u
   if
    local.get $3
    local.set $7
    local.get $6
    local.set $8
    i32.const 0
    local.set $9
    local.get $7
    local.get $8
    i32.const 2
    i32.shl
    i32.add
    local.get $9
    i32.store offset=4
    i32.const 0
    local.set $10
    loop $for-loop|1
     local.get $10
     i32.const 16
     i32.lt_u
     if
      local.get $3
      local.set $11
      local.get $6
      local.set $12
      local.get $10
      local.set $13
      i32.const 0
      local.set $14
      local.get $11
      local.get $12
      i32.const 4
      i32.shl
      local.get $13
      i32.add
      i32.const 2
      i32.shl
      i32.add
      local.get $14
      i32.store offset=96
      local.get $10
      i32.const 1
      i32.add
      local.set $10
      br $for-loop|1
     end
    end
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $for-loop|0
   end
  end
  local.get $0
  i32.const 1572
  i32.add
  local.set $15
  i32.const 0
  drop
  local.get $3
  local.get $15
  memory.size
  i64.extend_i32_s
  i64.const 16
  i64.shl
  call $~lib/rt/tlsf/addMemory
  drop
  local.get $3
  global.set $~lib/rt/tlsf/ROOT
 )
 (func $~lib/rt/tlsf/checkUsedBlock (param $0 i32) (result i32)
  (local $1 i32)
  local.get $0
  i32.const 4
  i32.sub
  local.set $1
  local.get $0
  i32.const 0
  i32.ne
  if (result i32)
   local.get $0
   i32.const 15
   i32.and
   i32.eqz
  else
   i32.const 0
  end
  if (result i32)
   local.get $1
   call $~lib/rt/common/BLOCK#get:mmInfo
   i32.const 1
   i32.and
   i32.eqz
  else
   i32.const 0
  end
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 562
   i32.const 3
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  return
 )
 (func $~lib/rt/tlsf/freeBlock (param $0 i32) (param $1 i32)
  i32.const 0
  drop
  local.get $1
  local.get $1
  call $~lib/rt/common/BLOCK#get:mmInfo
  i32.const 1
  i32.or
  call $~lib/rt/common/BLOCK#set:mmInfo
  local.get $0
  local.get $1
  call $~lib/rt/tlsf/insertBlock
 )
 (func $~lib/rt/tlsf/__free (param $0 i32)
  local.get $0
  global.get $~lib/memory/__heap_base
  i32.lt_u
  if
   return
  end
  global.get $~lib/rt/tlsf/ROOT
  i32.eqz
  if
   call $~lib/rt/tlsf/initialize
  end
  global.get $~lib/rt/tlsf/ROOT
  local.get $0
  call $~lib/rt/tlsf/checkUsedBlock
  call $~lib/rt/tlsf/freeBlock
 )
 (func $~lib/rt/itcms/free (param $0 i32)
  local.get $0
  global.get $~lib/memory/__heap_base
  i32.lt_u
  if
   local.get $0
   i32.const 0
   call $~lib/rt/itcms/Object#set:nextWithColor
   local.get $0
   i32.const 0
   call $~lib/rt/itcms/Object#set:prev
  else
   global.get $~lib/rt/itcms/total
   local.get $0
   call $~lib/rt/itcms/Object#get:size
   i32.sub
   global.set $~lib/rt/itcms/total
   i32.const 0
   drop
   local.get $0
   i32.const 4
   i32.add
   call $~lib/rt/tlsf/__free
  end
 )
 (func $~lib/rt/itcms/step (result i32)
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  block $break|0
   block $case2|0
    block $case1|0
     block $case0|0
      global.get $~lib/rt/itcms/state
      local.set $1
      local.get $1
      i32.const 0
      i32.eq
      br_if $case0|0
      local.get $1
      i32.const 1
      i32.eq
      br_if $case1|0
      local.get $1
      i32.const 2
      i32.eq
      br_if $case2|0
      br $break|0
     end
     i32.const 1
     global.set $~lib/rt/itcms/state
     i32.const 0
     global.set $~lib/rt/itcms/visitCount
     i32.const 0
     call $~lib/rt/itcms/visitRoots
     global.get $~lib/rt/itcms/toSpace
     global.set $~lib/rt/itcms/iter
     global.get $~lib/rt/itcms/visitCount
     i32.const 1
     i32.mul
     return
    end
    global.get $~lib/rt/itcms/white
    i32.eqz
    local.set $2
    global.get $~lib/rt/itcms/iter
    call $~lib/rt/itcms/Object#get:next
    local.set $0
    loop $while-continue|1
     local.get $0
     global.get $~lib/rt/itcms/toSpace
     i32.ne
     if
      local.get $0
      global.set $~lib/rt/itcms/iter
      local.get $0
      call $~lib/rt/itcms/Object#get:color
      local.get $2
      i32.ne
      if
       local.get $0
       local.get $2
       call $~lib/rt/itcms/Object#set:color
       i32.const 0
       global.set $~lib/rt/itcms/visitCount
       local.get $0
       i32.const 20
       i32.add
       i32.const 0
       call $~lib/rt/__visit_members
       global.get $~lib/rt/itcms/visitCount
       i32.const 1
       i32.mul
       return
      end
      local.get $0
      call $~lib/rt/itcms/Object#get:next
      local.set $0
      br $while-continue|1
     end
    end
    i32.const 0
    global.set $~lib/rt/itcms/visitCount
    i32.const 0
    call $~lib/rt/itcms/visitRoots
    global.get $~lib/rt/itcms/iter
    call $~lib/rt/itcms/Object#get:next
    local.set $0
    local.get $0
    global.get $~lib/rt/itcms/toSpace
    i32.eq
    if
     i32.const 0
     call $~lib/rt/itcms/visitStack
     global.get $~lib/rt/itcms/iter
     call $~lib/rt/itcms/Object#get:next
     local.set $0
     loop $while-continue|2
      local.get $0
      global.get $~lib/rt/itcms/toSpace
      i32.ne
      if
       local.get $0
       call $~lib/rt/itcms/Object#get:color
       local.get $2
       i32.ne
       if
        local.get $0
        local.get $2
        call $~lib/rt/itcms/Object#set:color
        local.get $0
        i32.const 20
        i32.add
        i32.const 0
        call $~lib/rt/__visit_members
       end
       local.get $0
       call $~lib/rt/itcms/Object#get:next
       local.set $0
       br $while-continue|2
      end
     end
     global.get $~lib/rt/itcms/fromSpace
     local.set $3
     global.get $~lib/rt/itcms/toSpace
     global.set $~lib/rt/itcms/fromSpace
     local.get $3
     global.set $~lib/rt/itcms/toSpace
     local.get $2
     global.set $~lib/rt/itcms/white
     local.get $3
     call $~lib/rt/itcms/Object#get:next
     global.set $~lib/rt/itcms/iter
     i32.const 2
     global.set $~lib/rt/itcms/state
    end
    global.get $~lib/rt/itcms/visitCount
    i32.const 1
    i32.mul
    return
   end
   global.get $~lib/rt/itcms/iter
   local.set $0
   local.get $0
   global.get $~lib/rt/itcms/toSpace
   i32.ne
   if
    local.get $0
    call $~lib/rt/itcms/Object#get:next
    global.set $~lib/rt/itcms/iter
    i32.const 1
    drop
    local.get $0
    call $~lib/rt/itcms/Object#get:color
    global.get $~lib/rt/itcms/white
    i32.eqz
    i32.eq
    i32.eqz
    if
     i32.const 0
     i32.const 6240
     i32.const 229
     i32.const 20
     call $~lib/builtins/abort
     unreachable
    end
    local.get $0
    call $~lib/rt/itcms/free
    i32.const 10
    return
   end
   global.get $~lib/rt/itcms/toSpace
   global.get $~lib/rt/itcms/toSpace
   call $~lib/rt/itcms/Object#set:nextWithColor
   global.get $~lib/rt/itcms/toSpace
   global.get $~lib/rt/itcms/toSpace
   call $~lib/rt/itcms/Object#set:prev
   i32.const 0
   global.set $~lib/rt/itcms/state
   br $break|0
  end
  i32.const 0
  return
 )
 (func $~lib/rt/itcms/interrupt
  (local $0 i32)
  i32.const 0
  drop
  i32.const 0
  drop
  i32.const 1024
  i32.const 200
  i32.mul
  i32.const 100
  i32.div_u
  local.set $0
  loop $do-loop|0
   local.get $0
   call $~lib/rt/itcms/step
   i32.sub
   local.set $0
   global.get $~lib/rt/itcms/state
   i32.const 0
   i32.eq
   if
    i32.const 0
    drop
    i32.const 200
    i32.const 100
    i32.rem_u
    i32.const 0
    i32.eq
    drop
    global.get $~lib/rt/itcms/total
    i32.const 200
    i32.const 100
    i32.div_u
    i32.mul
    i32.const 1024
    i32.add
    global.set $~lib/rt/itcms/threshold
    i32.const 0
    drop
    return
   end
   local.get $0
   i32.const 0
   i32.gt_s
   br_if $do-loop|0
  end
  i32.const 0
  drop
  global.get $~lib/rt/itcms/total
  i32.const 1024
  global.get $~lib/rt/itcms/total
  global.get $~lib/rt/itcms/threshold
  i32.sub
  i32.const 1024
  i32.lt_u
  i32.mul
  i32.add
  global.set $~lib/rt/itcms/threshold
  i32.const 0
  drop
 )
 (func $~lib/rt/tlsf/computeSize (param $0 i32) (result i32)
  local.get $0
  i32.const 12
  i32.le_u
  if (result i32)
   i32.const 12
  else
   local.get $0
   i32.const 4
   i32.add
   i32.const 15
   i32.add
   i32.const 15
   i32.const -1
   i32.xor
   i32.and
   i32.const 4
   i32.sub
  end
  return
 )
 (func $~lib/rt/tlsf/prepareSize (param $0 i32) (result i32)
  local.get $0
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 6176
   i32.const 6512
   i32.const 461
   i32.const 29
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  call $~lib/rt/tlsf/computeSize
  return
 )
 (func $~lib/rt/tlsf/roundSize (param $0 i32) (result i32)
  local.get $0
  i32.const 536870910
  i32.lt_u
  if (result i32)
   local.get $0
   i32.const 1
   i32.const 27
   local.get $0
   i32.clz
   i32.sub
   i32.shl
   i32.add
   i32.const 1
   i32.sub
  else
   local.get $0
  end
  return
 )
 (func $~lib/rt/tlsf/searchBlock (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  (local $14 i32)
  (local $15 i32)
  (local $16 i32)
  (local $17 i32)
  local.get $1
  i32.const 256
  i32.lt_u
  if
   i32.const 0
   local.set $2
   local.get $1
   i32.const 4
   i32.shr_u
   local.set $3
  else
   local.get $1
   call $~lib/rt/tlsf/roundSize
   local.set $4
   i32.const 4
   i32.const 8
   i32.mul
   i32.const 1
   i32.sub
   local.get $4
   i32.clz
   i32.sub
   local.set $2
   local.get $4
   local.get $2
   i32.const 4
   i32.sub
   i32.shr_u
   i32.const 1
   i32.const 4
   i32.shl
   i32.xor
   local.set $3
   local.get $2
   i32.const 8
   i32.const 1
   i32.sub
   i32.sub
   local.set $2
  end
  i32.const 1
  drop
  local.get $2
  i32.const 23
  i32.lt_u
  if (result i32)
   local.get $3
   i32.const 16
   i32.lt_u
  else
   i32.const 0
  end
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 334
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  block $~lib/rt/tlsf/GETSL|inlined.2 (result i32)
   local.get $0
   local.set $5
   local.get $2
   local.set $6
   local.get $5
   local.get $6
   i32.const 2
   i32.shl
   i32.add
   i32.load offset=4
   br $~lib/rt/tlsf/GETSL|inlined.2
  end
  i32.const 0
  i32.const -1
  i32.xor
  local.get $3
  i32.shl
  i32.and
  local.set $7
  i32.const 0
  local.set $8
  local.get $7
  i32.eqz
  if
   local.get $0
   call $~lib/rt/tlsf/Root#get:flMap
   i32.const 0
   i32.const -1
   i32.xor
   local.get $2
   i32.const 1
   i32.add
   i32.shl
   i32.and
   local.set $9
   local.get $9
   i32.eqz
   if
    i32.const 0
    local.set $8
   else
    local.get $9
    i32.ctz
    local.set $2
    block $~lib/rt/tlsf/GETSL|inlined.3 (result i32)
     local.get $0
     local.set $10
     local.get $2
     local.set $11
     local.get $10
     local.get $11
     i32.const 2
     i32.shl
     i32.add
     i32.load offset=4
     br $~lib/rt/tlsf/GETSL|inlined.3
    end
    local.set $7
    i32.const 1
    drop
    local.get $7
    i32.eqz
    if
     i32.const 0
     i32.const 6512
     i32.const 347
     i32.const 18
     call $~lib/builtins/abort
     unreachable
    end
    block $~lib/rt/tlsf/GETHEAD|inlined.2 (result i32)
     local.get $0
     local.set $12
     local.get $2
     local.set $13
     local.get $7
     i32.ctz
     local.set $14
     local.get $12
     local.get $13
     i32.const 4
     i32.shl
     local.get $14
     i32.add
     i32.const 2
     i32.shl
     i32.add
     i32.load offset=96
     br $~lib/rt/tlsf/GETHEAD|inlined.2
    end
    local.set $8
   end
  else
   block $~lib/rt/tlsf/GETHEAD|inlined.3 (result i32)
    local.get $0
    local.set $15
    local.get $2
    local.set $16
    local.get $7
    i32.ctz
    local.set $17
    local.get $15
    local.get $16
    i32.const 4
    i32.shl
    local.get $17
    i32.add
    i32.const 2
    i32.shl
    i32.add
    i32.load offset=96
    br $~lib/rt/tlsf/GETHEAD|inlined.3
   end
   local.set $8
  end
  local.get $8
  return
 )
 (func $~lib/rt/tlsf/growMemory (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  i32.const 0
  drop
  local.get $1
  i32.const 256
  i32.ge_u
  if
   local.get $1
   call $~lib/rt/tlsf/roundSize
   local.set $1
  end
  memory.size
  local.set $2
  local.get $1
  i32.const 4
  local.get $2
  i32.const 16
  i32.shl
  i32.const 4
  i32.sub
  block $~lib/rt/tlsf/GETTAIL|inlined.1 (result i32)
   local.get $0
   local.set $3
   local.get $3
   i32.load offset=1568
   br $~lib/rt/tlsf/GETTAIL|inlined.1
  end
  i32.ne
  i32.shl
  i32.add
  local.set $1
  local.get $1
  i32.const 65535
  i32.add
  i32.const 65535
  i32.const -1
  i32.xor
  i32.and
  i32.const 16
  i32.shr_u
  local.set $4
  local.get $2
  local.tee $5
  local.get $4
  local.tee $6
  local.get $5
  local.get $6
  i32.gt_s
  select
  local.set $7
  local.get $7
  memory.grow
  i32.const 0
  i32.lt_s
  if
   local.get $4
   memory.grow
   i32.const 0
   i32.lt_s
   if
    unreachable
   end
  end
  memory.size
  local.set $8
  local.get $0
  local.get $2
  i32.const 16
  i32.shl
  local.get $8
  i64.extend_i32_s
  i64.const 16
  i64.shl
  call $~lib/rt/tlsf/addMemory
  drop
 )
 (func $~lib/rt/tlsf/prepareBlock (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  local.get $1
  call $~lib/rt/common/BLOCK#get:mmInfo
  local.set $3
  i32.const 1
  drop
  local.get $2
  i32.const 4
  i32.add
  i32.const 15
  i32.and
  i32.eqz
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 361
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $3
  i32.const 3
  i32.const -1
  i32.xor
  i32.and
  local.get $2
  i32.sub
  local.set $4
  local.get $4
  i32.const 4
  i32.const 12
  i32.add
  i32.ge_u
  if
   local.get $1
   local.get $2
   local.get $3
   i32.const 2
   i32.and
   i32.or
   call $~lib/rt/common/BLOCK#set:mmInfo
   local.get $1
   i32.const 4
   i32.add
   local.get $2
   i32.add
   local.set $5
   local.get $5
   local.get $4
   i32.const 4
   i32.sub
   i32.const 1
   i32.or
   call $~lib/rt/common/BLOCK#set:mmInfo
   local.get $0
   local.get $5
   call $~lib/rt/tlsf/insertBlock
  else
   local.get $1
   local.get $3
   i32.const 1
   i32.const -1
   i32.xor
   i32.and
   call $~lib/rt/common/BLOCK#set:mmInfo
   block $~lib/rt/tlsf/GETRIGHT|inlined.3 (result i32)
    local.get $1
    local.set $7
    local.get $7
    i32.const 4
    i32.add
    local.get $7
    call $~lib/rt/common/BLOCK#get:mmInfo
    i32.const 3
    i32.const -1
    i32.xor
    i32.and
    i32.add
    br $~lib/rt/tlsf/GETRIGHT|inlined.3
   end
   block $~lib/rt/tlsf/GETRIGHT|inlined.2 (result i32)
    local.get $1
    local.set $6
    local.get $6
    i32.const 4
    i32.add
    local.get $6
    call $~lib/rt/common/BLOCK#get:mmInfo
    i32.const 3
    i32.const -1
    i32.xor
    i32.and
    i32.add
    br $~lib/rt/tlsf/GETRIGHT|inlined.2
   end
   call $~lib/rt/common/BLOCK#get:mmInfo
   i32.const 2
   i32.const -1
   i32.xor
   i32.and
   call $~lib/rt/common/BLOCK#set:mmInfo
  end
 )
 (func $~lib/rt/tlsf/allocateBlock (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  local.get $1
  call $~lib/rt/tlsf/prepareSize
  local.set $2
  local.get $0
  local.get $2
  call $~lib/rt/tlsf/searchBlock
  local.set $3
  local.get $3
  i32.eqz
  if
   local.get $0
   local.get $2
   call $~lib/rt/tlsf/growMemory
   local.get $0
   local.get $2
   call $~lib/rt/tlsf/searchBlock
   local.set $3
   i32.const 1
   drop
   local.get $3
   i32.eqz
   if
    i32.const 0
    i32.const 6512
    i32.const 499
    i32.const 16
    call $~lib/builtins/abort
    unreachable
   end
  end
  i32.const 1
  drop
  local.get $3
  call $~lib/rt/common/BLOCK#get:mmInfo
  i32.const 3
  i32.const -1
  i32.xor
  i32.and
  local.get $2
  i32.ge_u
  i32.eqz
  if
   i32.const 0
   i32.const 6512
   i32.const 501
   i32.const 14
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  local.get $3
  call $~lib/rt/tlsf/removeBlock
  local.get $0
  local.get $3
  local.get $2
  call $~lib/rt/tlsf/prepareBlock
  i32.const 0
  drop
  local.get $3
  return
 )
 (func $~lib/rt/tlsf/__alloc (param $0 i32) (result i32)
  global.get $~lib/rt/tlsf/ROOT
  i32.eqz
  if
   call $~lib/rt/tlsf/initialize
  end
  global.get $~lib/rt/tlsf/ROOT
  local.get $0
  call $~lib/rt/tlsf/allocateBlock
  i32.const 4
  i32.add
  return
 )
 (func $~lib/rt/itcms/Object#set:rtId (param $0 i32) (param $1 i32)
  local.get $0
  local.get $1
  i32.store offset=12
 )
 (func $~lib/rt/itcms/Object#set:rtSize (param $0 i32) (param $1 i32)
  local.get $0
  local.get $1
  i32.store offset=16
 )
 (func $~lib/rt/itcms/__new (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  local.get $0
  i32.const 1073741804
  i32.ge_u
  if
   i32.const 6176
   i32.const 6240
   i32.const 261
   i32.const 31
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/rt/itcms/total
  global.get $~lib/rt/itcms/threshold
  i32.ge_u
  if
   call $~lib/rt/itcms/interrupt
  end
  i32.const 16
  local.get $0
  i32.add
  call $~lib/rt/tlsf/__alloc
  i32.const 4
  i32.sub
  local.set $2
  local.get $2
  local.get $1
  call $~lib/rt/itcms/Object#set:rtId
  local.get $2
  local.get $0
  call $~lib/rt/itcms/Object#set:rtSize
  local.get $2
  global.get $~lib/rt/itcms/fromSpace
  global.get $~lib/rt/itcms/white
  call $~lib/rt/itcms/Object#linkTo
  global.get $~lib/rt/itcms/total
  local.get $2
  call $~lib/rt/itcms/Object#get:size
  i32.add
  global.set $~lib/rt/itcms/total
  local.get $2
  i32.const 20
  i32.add
  local.set $3
  local.get $3
  i32.const 0
  local.get $0
  memory.fill
  local.get $3
  return
 )
 (func $src_wasm/assembly/decimal/Pair#set:m (param $0 i32) (param $1 f64)
  local.get $0
  local.get $1
  f64.store
 )
 (func $src_wasm/assembly/decimal/Pair#set:e (param $0 i32) (param $1 f64)
  local.get $0
  local.get $1
  f64.store offset=8
 )
 (func $src_wasm/assembly/decimal/wasmPow (param $0 f64) (param $1 f64) (result f64)
  (local $2 f64)
  (local $3 i32)
  local.get $1
  f64.const 0
  f64.eq
  if
   f64.const 1
   return
  end
  local.get $0
  f64.const 0
  f64.eq
  if
   f64.const 0
   return
  end
  local.get $1
  f64.const 1
  f64.eq
  if
   local.get $0
   return
  end
  local.get $1
  local.get $1
  f64.floor
  f64.eq
  if
   f64.const 1
   local.set $2
   local.get $1
   i32.trunc_sat_f64_s
   local.set $3
   local.get $3
   i32.const 0
   i32.lt_s
   if
    f64.const 1
    local.get $0
    f64.div
    local.set $0
    i32.const 0
    local.get $3
    i32.sub
    local.set $3
   end
   loop $while-continue|0
    local.get $3
    i32.const 0
    i32.gt_s
    if
     local.get $3
     i32.const 1
     i32.and
     i32.const 0
     i32.ne
     if
      local.get $2
      local.get $0
      f64.mul
      local.set $2
     end
     local.get $0
     local.get $0
     f64.mul
     local.set $0
     local.get $3
     i32.const 1
     i32.shr_s
     local.set $3
     br $while-continue|0
    end
   end
   local.get $2
   return
  end
  local.get $0
  local.get $1
  call $~lib/math/NativeMath.pow
  return
 )
 (func $src_wasm/assembly/decimal/_add (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result i32)
  (local $4 f64)
  (local $5 f64)
  local.get $0
  call $src_wasm/assembly/decimal/wasmAbs
  global.get $src_wasm/assembly/decimal/TINY
  f64.lt
  if
   i32.const 0
   local.get $2
   local.get $3
   call $src_wasm/assembly/decimal/Pair#constructor
   return
  end
  local.get $2
  call $src_wasm/assembly/decimal/wasmAbs
  global.get $src_wasm/assembly/decimal/TINY
  f64.lt
  if
   i32.const 0
   local.get $0
   local.get $1
   call $src_wasm/assembly/decimal/Pair#constructor
   return
  end
  local.get $1
  local.get $3
  f64.eq
  if
   i32.const 0
   local.get $0
   local.get $2
   f64.add
   local.get $1
   call $src_wasm/assembly/decimal/Pair#constructor
   return
  end
  local.get $1
  local.get $3
  f64.sub
  local.set $4
  local.get $4
  f64.const 10
  f64.gt
  if
   i32.const 0
   local.get $0
   local.get $1
   call $src_wasm/assembly/decimal/Pair#constructor
   return
  end
  local.get $4
  f64.const -10
  f64.lt
  if
   i32.const 0
   local.get $2
   local.get $3
   call $src_wasm/assembly/decimal/Pair#constructor
   return
  end
  f64.const 10
  local.get $4
  call $src_wasm/assembly/decimal/wasmPow
  local.set $5
  i32.const 0
  local.get $0
  local.get $2
  local.get $5
  f64.mul
  f64.add
  local.get $1
  call $src_wasm/assembly/decimal/Pair#constructor
  return
 )
 (func $src_wasm/assembly/decimal/Pair#get:m (param $0 i32) (result f64)
  local.get $0
  f64.load
 )
 (func $src_wasm/assembly/decimal/Pair#get:e (param $0 i32) (result f64)
  local.get $0
  f64.load offset=8
 )
 (func $src_wasm/assembly/decimal/decimal_mul (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result f64)
  local.get $0
  local.get $2
  f64.mul
  return
 )
 (func $src_wasm/assembly/decimal/decimal_mul_exp (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result f64)
  local.get $1
  local.get $3
  f64.add
  return
 )
 (func $src_wasm/assembly/decimal/decimal_div (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result f64)
  local.get $2
  f64.const 0
  f64.eq
  if
   f64.const 0
   return
  end
  local.get $0
  local.get $2
  f64.div
  return
 )
 (func $src_wasm/assembly/decimal/decimal_div_exp (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result f64)
  local.get $2
  f64.const 0
  f64.eq
  if
   f64.const 0
   return
  end
  local.get $1
  local.get $3
  f64.sub
  return
 )
 (func $src_wasm/assembly/decimal/decimal_wasmPow (param $0 f64) (param $1 f64) (param $2 f64) (result f64)
  (local $3 f64)
  local.get $0
  call $src_wasm/assembly/decimal/wasmAbs
  local.get $2
  call $src_wasm/assembly/decimal/wasmPow
  local.set $3
  local.get $0
  f64.const 0
  f64.lt
  if (result f64)
   local.get $3
   f64.neg
  else
   local.get $3
  end
  return
 )
 (func $src_wasm/assembly/decimal/decimal_wasmPow_exp (param $0 f64) (param $1 f64) (param $2 f64) (result f64)
  local.get $1
  local.get $2
  f64.mul
  return
 )
 (func $src_wasm/assembly/decimal/decimal_abs (param $0 f64) (param $1 f64) (result f64)
  local.get $0
  call $src_wasm/assembly/decimal/wasmAbs
  return
 )
 (func $src_wasm/assembly/decimal/wasmFloor (param $0 f64) (result f64)
  (local $1 f64)
  block $~lib/math/NativeMath.floor|inlined.1 (result f64)
   local.get $0
   local.set $1
   local.get $1
   f64.floor
   br $~lib/math/NativeMath.floor|inlined.1
  end
  return
 )
 (func $src_wasm/assembly/decimal/decimal_wasmFloor (param $0 f64) (param $1 f64) (result f64)
  (local $2 f64)
  local.get $1
  f64.const 15
  f64.ge
  if
   local.get $0
   return
  end
  local.get $1
  f64.const 0
  f64.lt
  if
   f64.const 0
   return
  end
  f64.const 10
  local.get $1
  call $src_wasm/assembly/decimal/wasmPow
  local.set $2
  local.get $0
  local.get $2
  f64.mul
  call $src_wasm/assembly/decimal/wasmFloor
  local.get $2
  f64.div
  return
 )
 (func $src_wasm/assembly/decimal/wasmSqrt (param $0 f64) (result f64)
  (local $1 f64)
  block $~lib/math/NativeMath.sqrt|inlined.0 (result f64)
   local.get $0
   local.set $1
   local.get $1
   f64.sqrt
   br $~lib/math/NativeMath.sqrt|inlined.0
  end
  return
 )
 (func $src_wasm/assembly/decimal/decimal_wasmSqrt (param $0 f64) (param $1 f64) (result f64)
  (local $2 f64)
  local.get $0
  f64.const 0
  f64.lt
  if
   f64.const 0
   return
  end
  local.get $0
  call $src_wasm/assembly/decimal/wasmSqrt
  local.set $2
  local.get $2
  return
 )
 (func $src_wasm/assembly/decimal/decimal_wasmSqrt_exp (param $0 f64) (param $1 f64) (result f64)
  (local $2 f64)
  local.get $0
  f64.const 0
  f64.lt
  if
   f64.const 0
   return
  end
  local.get $1
  local.set $2
  local.get $1
  local.get $1
  call $src_wasm/assembly/decimal/wasmFloor
  f64.ne
  if
   local.get $2
   f64.const 2
   f64.div
   return
  end
  local.get $2
  f64.const 2
  f64.div
  return
 )
 (func $~lib/math/NativeMath.log10 (param $0 f64) (result f64)
  (local $1 i64)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 f64)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  (local $9 f64)
  (local $10 f64)
  (local $11 f64)
  (local $12 f64)
  (local $13 f64)
  (local $14 f64)
  (local $15 f64)
  (local $16 f64)
  (local $17 f64)
  (local $18 f64)
  local.get $0
  i64.reinterpret_f64
  local.set $1
  local.get $1
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.set $2
  i32.const 0
  local.set $3
  local.get $2
  i32.const 31
  i32.shr_u
  local.set $4
  local.get $4
  if (result i32)
   i32.const 1
  else
   local.get $2
   i32.const 1048576
   i32.lt_u
  end
  if
   local.get $1
   i64.const 1
   i64.shl
   i64.const 0
   i64.eq
   if
    f64.const -1
    local.get $0
    local.get $0
    f64.mul
    f64.div
    return
   end
   local.get $4
   if
    local.get $0
    local.get $0
    f64.sub
    f64.const 0
    f64.div
    return
   end
   local.get $3
   i32.const 54
   i32.sub
   local.set $3
   local.get $0
   f64.const 18014398509481984
   f64.mul
   local.set $0
   local.get $0
   i64.reinterpret_f64
   local.set $1
   local.get $1
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   local.set $2
  else
   local.get $2
   i32.const 2146435072
   i32.ge_u
   if
    local.get $0
    return
   else
    local.get $2
    i32.const 1072693248
    i32.eq
    if (result i32)
     local.get $1
     i64.const 32
     i64.shl
     i64.const 0
     i64.eq
    else
     i32.const 0
    end
    if
     f64.const 0
     return
    end
   end
  end
  local.get $2
  i32.const 1072693248
  i32.const 1072079006
  i32.sub
  i32.add
  local.set $2
  local.get $3
  local.get $2
  i32.const 20
  i32.shr_u
  i32.const 1023
  i32.sub
  i32.add
  local.set $3
  local.get $2
  i32.const 1048575
  i32.and
  i32.const 1072079006
  i32.add
  local.set $2
  local.get $2
  i64.extend_i32_u
  i64.const 32
  i64.shl
  local.get $1
  i64.const 4294967295
  i64.and
  i64.or
  local.set $1
  local.get $1
  f64.reinterpret_i64
  local.set $0
  local.get $0
  f64.const 1
  f64.sub
  local.set $5
  f64.const 0.5
  local.get $5
  f64.mul
  local.get $5
  f64.mul
  local.set $6
  local.get $5
  f64.const 2
  local.get $5
  f64.add
  f64.div
  local.set $7
  local.get $7
  local.get $7
  f64.mul
  local.set $8
  local.get $8
  local.get $8
  f64.mul
  local.set $9
  local.get $9
  f64.const 0.3999999999940942
  local.get $9
  f64.const 0.22222198432149784
  local.get $9
  f64.const 0.15313837699209373
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  local.set $10
  local.get $8
  f64.const 0.6666666666666735
  local.get $9
  f64.const 0.2857142874366239
  local.get $9
  f64.const 0.1818357216161805
  local.get $9
  f64.const 0.14798198605116586
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.mul
  local.set $11
  local.get $11
  local.get $10
  f64.add
  local.set $12
  local.get $5
  local.get $6
  f64.sub
  local.set $13
  local.get $13
  i64.reinterpret_f64
  local.set $1
  local.get $1
  i64.const -4294967296
  i64.and
  local.set $1
  local.get $1
  f64.reinterpret_i64
  local.set $13
  local.get $5
  local.get $13
  f64.sub
  local.get $6
  f64.sub
  local.get $7
  local.get $6
  local.get $12
  f64.add
  f64.mul
  f64.add
  local.set $14
  local.get $13
  f64.const 0.4342944818781689
  f64.mul
  local.set $15
  local.get $3
  f64.convert_i32_s
  local.set $16
  local.get $16
  f64.const 0.30102999566361177
  f64.mul
  local.set $17
  local.get $16
  f64.const 3.694239077158931e-13
  f64.mul
  local.get $14
  local.get $13
  f64.add
  f64.const 2.5082946711645275e-11
  f64.mul
  f64.add
  local.get $14
  f64.const 0.4342944818781689
  f64.mul
  f64.add
  local.set $18
  local.get $17
  local.get $15
  f64.add
  local.set $9
  local.get $18
  local.get $17
  local.get $9
  f64.sub
  local.get $15
  f64.add
  f64.add
  local.set $18
  local.get $18
  local.get $9
  f64.add
  return
 )
 (func $src_wasm/assembly/decimal/wasmLog10 (param $0 f64) (result f64)
  local.get $0
  call $~lib/math/NativeMath.log10
  return
 )
 (func $src_wasm/assembly/decimal/decimal_wasmLog10 (param $0 f64) (param $1 f64) (result f64)
  local.get $0
  f64.const 0
  f64.le
  if
   f64.const 0
   return
  end
  local.get $0
  call $src_wasm/assembly/decimal/wasmLog10
  local.get $1
  f64.add
  return
 )
 (func $src_wasm/assembly/decimal/_compare (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result i32)
  (local $4 f64)
  (local $5 f64)
  local.get $0
  f64.const 0
  f64.ge
  local.get $2
  f64.const 0
  f64.ge
  i32.ne
  if
   local.get $0
   f64.const 0
   f64.ge
   if (result i32)
    i32.const 1
   else
    i32.const -1
   end
   return
  end
  local.get $0
  call $src_wasm/assembly/decimal/wasmAbs
  global.get $src_wasm/assembly/decimal/TINY
  f64.lt
  if (result i32)
   local.get $2
   call $src_wasm/assembly/decimal/wasmAbs
   global.get $src_wasm/assembly/decimal/TINY
   f64.lt
  else
   i32.const 0
  end
  if
   i32.const 0
   return
  end
  local.get $1
  local.get $3
  f64.sub
  local.set $4
  local.get $4
  f64.const 10
  f64.gt
  if
   local.get $0
   f64.const 0
   f64.ge
   if (result i32)
    i32.const 1
   else
    i32.const -1
   end
   return
  end
  local.get $4
  f64.const -10
  f64.lt
  if
   local.get $0
   f64.const 0
   f64.ge
   if (result i32)
    i32.const -1
   else
    i32.const 1
   end
   return
  end
  f64.const 10
  local.get $4
  call $src_wasm/assembly/decimal/wasmPow
  local.set $5
  local.get $0
  local.get $5
  f64.mul
  local.get $2
  f64.sub
  call $src_wasm/assembly/decimal/wasmAbs
  f64.const 1e-10
  f64.lt
  if
   i32.const 0
   return
  end
  local.get $0
  local.get $5
  f64.mul
  local.get $2
  f64.gt
  if (result i32)
   i32.const 1
  else
   i32.const -1
  end
  return
 )
 (func $src_wasm/assembly/decimal/decimal_gte (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result i32)
  local.get $0
  local.get $1
  local.get $2
  local.get $3
  call $src_wasm/assembly/decimal/_compare
  i32.const 0
  i32.ge_s
  return
 )
 (func $src_wasm/assembly/decimal/decimal_lt (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result i32)
  local.get $0
  local.get $1
  local.get $2
  local.get $3
  call $src_wasm/assembly/decimal/_compare
  i32.const 0
  i32.lt_s
  return
 )
 (func $src_wasm/assembly/decimal/decimal_eq (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result i32)
  local.get $0
  local.get $1
  local.get $2
  local.get $3
  call $src_wasm/assembly/decimal/_compare
  i32.const 0
  i32.eq
  return
 )
 (func $src_wasm/assembly/decimal/decimal_isZero (param $0 f64) (param $1 f64) (result i32)
  local.get $0
  call $src_wasm/assembly/decimal/wasmAbs
  global.get $src_wasm/assembly/decimal/TINY
  f64.lt
  return
 )
 (func $src_wasm/assembly/ecs/ecs_player_getGold (result f64)
  global.get $src_wasm/assembly/ecs/OFF_GOLD
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_player_setGold (param $0 f64)
  global.get $src_wasm/assembly/ecs/OFF_GOLD
  local.get $0
  f64.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_GOLD
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_player_addGold (param $0 f64)
  (local $1 f64)
  global.get $src_wasm/assembly/ecs/OFF_GOLD
  f64.load
  local.set $1
  global.get $src_wasm/assembly/ecs/OFF_GOLD
  local.get $1
  local.get $0
  f64.add
  f64.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_GOLD
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_player_getXP (result f64)
  global.get $src_wasm/assembly/ecs/OFF_XP
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_player_setXP (param $0 f64)
  global.get $src_wasm/assembly/ecs/OFF_XP
  local.get $0
  f64.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_XP
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_player_addXP (param $0 f64)
  (local $1 f64)
  global.get $src_wasm/assembly/ecs/OFF_XP
  f64.load
  local.set $1
  global.get $src_wasm/assembly/ecs/OFF_XP
  local.get $1
  local.get $0
  f64.add
  f64.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_XP
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_player_getLevel (result i32)
  global.get $src_wasm/assembly/ecs/OFF_LEVEL
  i32.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_player_incLevel
  (local $0 i32)
  global.get $src_wasm/assembly/ecs/OFF_LEVEL
  i32.load
  i32.const 1
  i32.add
  local.set $0
  global.get $src_wasm/assembly/ecs/OFF_LEVEL
  local.get $0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_LEVEL
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_player_getKills (result i64)
  global.get $src_wasm/assembly/ecs/OFF_KILLS
  i64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_player_incKills (param $0 i64)
  (local $1 i64)
  global.get $src_wasm/assembly/ecs/OFF_KILLS
  i64.load
  local.set $1
  global.get $src_wasm/assembly/ecs/OFF_KILLS
  local.get $1
  local.get $0
  i64.add
  i64.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_KILLS
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_player_getMomentum (result f64)
  global.get $src_wasm/assembly/ecs/OFF_MOMENTUM
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_player_setMomentum (param $0 f64)
  global.get $src_wasm/assembly/ecs/OFF_MOMENTUM
  local.get $0
  f64.store
 )
 (func $src_wasm/assembly/ecs/ecs_player_getOvercharge (result f64)
  global.get $src_wasm/assembly/ecs/OFF_OVERCHARGE
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_player_setOvercharge (param $0 f64)
  global.get $src_wasm/assembly/ecs/OFF_OVERCHARGE
  local.get $0
  f64.store
 )
 (func $src_wasm/assembly/ecs/ecs_player_getAtk (result f64)
  global.get $src_wasm/assembly/ecs/OFF_ATK
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_player_setAtk (param $0 f64)
  global.get $src_wasm/assembly/ecs/OFF_ATK
  local.get $0
  f64.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_STATS
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_player_getDef (result f64)
  global.get $src_wasm/assembly/ecs/OFF_DEF
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_player_setDef (param $0 f64)
  global.get $src_wasm/assembly/ecs/OFF_DEF
  local.get $0
  f64.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_STATS
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_player_getHP (result f64)
  global.get $src_wasm/assembly/ecs/OFF_HP
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_player_setHP (param $0 f64)
  global.get $src_wasm/assembly/ecs/OFF_HP
  local.get $0
  f64.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_STATS
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_player_getCrit (result f64)
  global.get $src_wasm/assembly/ecs/OFF_CRIT
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_player_setCrit (param $0 f64)
  global.get $src_wasm/assembly/ecs/OFF_CRIT
  local.get $0
  f64.store
 )
 (func $src_wasm/assembly/ecs/ecs_upgrade_getLevel (param $0 i32) (result i32)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_UPGRADE_ID
   i32.ge_s
  end
  if
   i32.const 0
   return
  end
  global.get $src_wasm/assembly/ecs/UPGRADE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/UPGRADE_STRIDE
  i32.mul
  i32.add
  i32.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_upgrade_setLevel (param $0 i32) (param $1 i32)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_UPGRADE_ID
   i32.ge_s
  end
  if
   return
  end
  global.get $src_wasm/assembly/ecs/UPGRADE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/UPGRADE_STRIDE
  i32.mul
  i32.add
  local.get $1
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_UPGRADE_BASE
  local.get $0
  i32.add
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_upgrade_incLevel (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_UPGRADE_ID
   i32.ge_s
  end
  if
   i32.const 0
   return
  end
  global.get $src_wasm/assembly/ecs/UPGRADE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/UPGRADE_STRIDE
  i32.mul
  i32.add
  local.set $2
  local.get $2
  i32.load
  local.set $3
  local.get $3
  local.get $1
  i32.add
  local.set $4
  local.get $2
  local.get $4
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_UPGRADE_BASE
  local.get $0
  i32.add
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
  local.get $4
  return
 )
 (func $src_wasm/assembly/ecs/ecs_upgrade_getCostBase (param $0 i32) (result f64)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_UPGRADE_ID
   i32.ge_s
  end
  if
   f64.const 0
   return
  end
  global.get $src_wasm/assembly/ecs/UPGRADE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/UPGRADE_STRIDE
  i32.mul
  i32.add
  i32.const 4
  i32.add
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_upgrade_getCostGain (param $0 i32) (result f64)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_UPGRADE_ID
   i32.ge_s
  end
  if
   f64.const 0
   return
  end
  global.get $src_wasm/assembly/ecs/UPGRADE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/UPGRADE_STRIDE
  i32.mul
  i32.add
  i32.const 12
  i32.add
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_upgrade_getCostType (param $0 i32) (result i32)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_UPGRADE_ID
   i32.ge_s
  end
  if
   i32.const 0
   return
  end
  global.get $src_wasm/assembly/ecs/UPGRADE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/UPGRADE_STRIDE
  i32.mul
  i32.add
  i32.const 20
  i32.add
  i32.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_upgrade_setCostParams (param $0 i32) (param $1 f64) (param $2 f64) (param $3 i32)
  (local $4 i32)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_UPGRADE_ID
   i32.ge_s
  end
  if
   return
  end
  global.get $src_wasm/assembly/ecs/UPGRADE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/UPGRADE_STRIDE
  i32.mul
  i32.add
  i32.const 4
  i32.add
  local.set $4
  local.get $4
  local.get $1
  f64.store
  local.get $4
  i32.const 8
  i32.add
  local.get $2
  f64.store
  local.get $4
  i32.const 16
  i32.add
  local.get $3
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_resource_getAmount (param $0 i32) (result f64)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_RESOURCE_ID
   i32.ge_s
  end
  if
   f64.const 0
   return
  end
  global.get $src_wasm/assembly/ecs/RESOURCE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/RESOURCE_STRIDE
  i32.mul
  i32.add
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_resource_setAmount (param $0 i32) (param $1 f64)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_RESOURCE_ID
   i32.ge_s
  end
  if
   return
  end
  global.get $src_wasm/assembly/ecs/RESOURCE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/RESOURCE_STRIDE
  i32.mul
  i32.add
  local.get $1
  f64.store
 )
 (func $src_wasm/assembly/ecs/ecs_resource_addAmount (param $0 i32) (param $1 f64)
  (local $2 i32)
  (local $3 f64)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_RESOURCE_ID
   i32.ge_s
  end
  if
   return
  end
  global.get $src_wasm/assembly/ecs/RESOURCE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/RESOURCE_STRIDE
  i32.mul
  i32.add
  local.set $2
  local.get $2
  f64.load
  local.set $3
  local.get $2
  local.get $3
  local.get $1
  f64.add
  f64.store
 )
 (func $src_wasm/assembly/ecs/ecs_resource_getRate (param $0 i32) (result f64)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_RESOURCE_ID
   i32.ge_s
  end
  if
   f64.const 0
   return
  end
  global.get $src_wasm/assembly/ecs/RESOURCE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/RESOURCE_STRIDE
  i32.mul
  i32.add
  i32.const 8
  i32.add
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_resource_setRate (param $0 i32) (param $1 f64)
  local.get $0
  i32.const 0
  i32.lt_s
  if (result i32)
   i32.const 1
  else
   local.get $0
   global.get $src_wasm/assembly/ecs/MAX_RESOURCE_ID
   i32.ge_s
  end
  if
   return
  end
  global.get $src_wasm/assembly/ecs/RESOURCE_OFF
  local.get $0
  global.get $src_wasm/assembly/ecs/RESOURCE_STRIDE
  i32.mul
  i32.add
  i32.const 8
  i32.add
  local.get $1
  f64.store
 )
 (func $src_wasm/assembly/ecs/ecs_enemy_getHP (result f64)
  global.get $src_wasm/assembly/ecs/OFF_ENEMY_HP
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_enemy_setHP (param $0 f64)
  global.get $src_wasm/assembly/ecs/OFF_ENEMY_HP
  local.get $0
  f64.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  global.get $src_wasm/assembly/ecs/DIRTY_ENEMY
  i32.const 4
  i32.mul
  i32.add
  i32.const 1
  i32.store
 )
 (func $src_wasm/assembly/ecs/ecs_enemy_getMaxHP (result f64)
  global.get $src_wasm/assembly/ecs/OFF_ENEMY_MAX_HP
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_enemy_setMaxHP (param $0 f64)
  global.get $src_wasm/assembly/ecs/OFF_ENEMY_MAX_HP
  local.get $0
  f64.store
 )
 (func $src_wasm/assembly/ecs/ecs_enemy_getAtk (result f64)
  global.get $src_wasm/assembly/ecs/OFF_ENEMY_ATK
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_enemy_getDef (result f64)
  global.get $src_wasm/assembly/ecs/OFF_ENEMY_DEF
  f64.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_enemy_getLevel (result i32)
  global.get $src_wasm/assembly/ecs/OFF_ENEMY_LEVEL
  i32.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_combat_isActive (result i32)
  global.get $src_wasm/assembly/ecs/OFF_COMBAT_ACTIVE
  i32.load
  return
 )
 (func $src_wasm/assembly/ecs/ecs_combat_setActive (param $0 i32)
  global.get $src_wasm/assembly/ecs/OFF_COMBAT_ACTIVE
  local.get $0
  i32.store
 )
 (func $src_wasm/assembly/ecs/world_getTickCount (result i64)
  global.get $src_wasm/assembly/ecs/OFF_TICK_COUNT
  i64.load
  return
 )
 (func $src_wasm/assembly/ecs/world_incTick
  (local $0 i64)
  global.get $src_wasm/assembly/ecs/OFF_TICK_COUNT
  i64.load
  local.set $0
  global.get $src_wasm/assembly/ecs/OFF_TICK_COUNT
  local.get $0
  i64.const 1
  i64.add
  i64.store
 )
 (func $src_wasm/assembly/ecs/world_getDirtyFlags (result i32)
  (local $0 i32)
  i32.const 0
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 0
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 4
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 8
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 12
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 16
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 20
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 24
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 28
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 32
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 36
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 40
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 44
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 48
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 52
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 56
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 60
  i32.add
  i32.load
  i32.or
  local.set $0
  local.get $0
  return
 )
 (func $src_wasm/assembly/ecs/world_clearDirty (param $0 i32)
  local.get $0
  i32.const 0
  i32.ge_s
  if (result i32)
   local.get $0
   i32.const 16
   i32.lt_s
  else
   i32.const 0
  end
  if
   global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
   local.get $0
   i32.const 4
   i32.mul
   i32.add
   i32.const 0
   i32.store
  end
 )
 (func $src_wasm/assembly/ecs/world_clearAllDirty
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 0
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 4
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 8
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 12
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 16
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 20
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 24
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 28
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 32
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 36
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 40
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 44
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 48
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 52
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 56
  i32.add
  i32.const 0
  i32.store
  global.get $src_wasm/assembly/ecs/OFF_DIRTY_FLAGS
  i32.const 60
  i32.add
  i32.const 0
  i32.store
 )
 (func $src_wasm/assembly/ecs/cost_linear (param $0 i32) (param $1 i32) (param $2 f64) (param $3 f64) (result f64)
  (local $4 f64)
  (local $5 f64)
  local.get $1
  i32.const 0
  i32.le_s
  if
   f64.const 0
   return
  end
  local.get $1
  f64.convert_i32_s
  local.set $4
  local.get $0
  f64.convert_i32_s
  local.set $5
  local.get $4
  local.get $2
  f64.mul
  local.get $3
  local.get $4
  local.get $5
  f64.mul
  local.get $4
  local.get $4
  f64.const 1
  f64.sub
  f64.mul
  f64.const 0.5
  f64.mul
  f64.add
  f64.mul
  f64.add
  return
 )
 (func $src_wasm/assembly/ecs/absD (param $0 f64) (result f64)
  local.get $0
  f64.const 0
  f64.lt
  if (result f64)
   local.get $0
   f64.neg
  else
   local.get $0
  end
  return
 )
 (func $src_wasm/assembly/ecs/floor (param $0 f64) (result f64)
  (local $1 f64)
  block $~lib/math/NativeMath.floor|inlined.2 (result f64)
   local.get $0
   local.set $1
   local.get $1
   f64.floor
   br $~lib/math/NativeMath.floor|inlined.2
  end
  return
 )
 (func $src_wasm/assembly/ecs/wasmPow (param $0 f64) (param $1 f64) (result f64)
  (local $2 f64)
  (local $3 i32)
  local.get $1
  f64.const 0
  f64.eq
  if
   f64.const 1
   return
  end
  local.get $0
  f64.const 0
  f64.eq
  if
   f64.const 0
   return
  end
  local.get $1
  f64.const 1
  f64.eq
  if
   local.get $0
   return
  end
  local.get $1
  local.get $1
  call $src_wasm/assembly/ecs/floor
  f64.eq
  if
   f64.const 1
   local.set $2
   local.get $1
   i32.trunc_sat_f64_s
   local.set $3
   local.get $3
   i32.const 0
   i32.lt_s
   if
    f64.const 1
    local.get $0
    f64.div
    local.set $0
    i32.const 0
    local.get $3
    i32.sub
    local.set $3
   end
   loop $while-continue|0
    local.get $3
    i32.const 0
    i32.gt_s
    if
     local.get $3
     i32.const 1
     i32.and
     i32.const 0
     i32.ne
     if
      local.get $2
      local.get $0
      f64.mul
      local.set $2
     end
     local.get $0
     local.get $0
     f64.mul
     local.set $0
     local.get $3
     i32.const 1
     i32.shr_s
     local.set $3
     br $while-continue|0
    end
   end
   local.get $2
   return
  end
  local.get $0
  local.get $1
  call $~lib/math/NativeMath.pow
  return
 )
 (func $src_wasm/assembly/ecs/cost_geometric (param $0 i32) (param $1 i32) (param $2 f64) (param $3 f64) (result f64)
  (local $4 f64)
  (local $5 f64)
  local.get $1
  i32.const 0
  i32.le_s
  if
   f64.const 0
   return
  end
  local.get $3
  f64.const 1
  f64.sub
  call $src_wasm/assembly/ecs/absD
  f64.const 1e-10
  f64.lt
  if
   local.get $2
   local.get $1
   f64.convert_i32_s
   f64.mul
   return
  end
  local.get $0
  f64.convert_i32_s
  local.set $4
  local.get $1
  f64.convert_i32_s
  local.set $5
  local.get $2
  local.get $3
  local.get $4
  call $src_wasm/assembly/ecs/wasmPow
  f64.mul
  local.get $3
  local.get $5
  call $src_wasm/assembly/ecs/wasmPow
  f64.const 1
  f64.sub
  f64.mul
  local.get $3
  f64.const 1
  f64.sub
  f64.div
  return
 )
 (func $src_wasm/assembly/ecs/sqrt (param $0 f64) (result f64)
  (local $1 f64)
  block $~lib/math/NativeMath.sqrt|inlined.1 (result f64)
   local.get $0
   local.set $1
   local.get $1
   f64.sqrt
   br $~lib/math/NativeMath.sqrt|inlined.1
  end
  return
 )
 (func $src_wasm/assembly/ecs/cost_maxAffordable_linear (param $0 f64) (param $1 i32) (param $2 f64) (param $3 f64) (result i32)
  (local $4 f64)
  (local $5 f64)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  (local $9 i32)
  (local $10 f64)
  local.get $0
  f64.const 0
  f64.le
  if (result i32)
   i32.const 1
  else
   local.get $3
   f64.const 0
   f64.le
  end
  if
   i32.const 0
   return
  end
  local.get $1
  f64.convert_i32_s
  local.set $4
  f64.const 0.5
  local.get $3
  f64.mul
  local.set $5
  local.get $3
  local.get $4
  f64.mul
  local.get $2
  f64.add
  f64.const 0.5
  local.get $3
  f64.mul
  f64.sub
  local.set $6
  local.get $6
  local.get $6
  f64.mul
  f64.const 2
  local.get $3
  f64.mul
  local.get $0
  f64.mul
  f64.add
  local.set $7
  local.get $7
  f64.const 0
  f64.lt
  if
   i32.const 0
   return
  end
  local.get $6
  f64.neg
  local.get $7
  call $src_wasm/assembly/ecs/sqrt
  f64.add
  local.get $3
  f64.div
  call $src_wasm/assembly/ecs/floor
  local.set $8
  local.get $8
  f64.const 0
  f64.gt
  if (result f64)
   local.get $8
  else
   f64.const 0
  end
  i32.trunc_sat_f64_s
  local.set $9
  local.get $1
  local.get $9
  local.get $2
  local.get $3
  call $src_wasm/assembly/ecs/cost_linear
  local.set $10
  local.get $10
  local.get $0
  f64.gt
  if
   local.get $9
   i32.const 1
   i32.sub
   return
  end
  local.get $9
  return
 )
 (func $src_wasm/assembly/combat/rngFloat (result f64)
  call $src_wasm/assembly/combat/rngNext
  i64.const 1
  i64.shr_u
  f64.convert_i64_u
  f64.const -9223372036854775808
  f64.div
  return
 )
 (func $src_wasm/assembly/combat/checkLevelUp
  (local $0 i32)
  (local $1 f64)
  (local $2 f64)
  global.get $src_wasm/assembly/combat/OFF_LEVEL
  i32.load
  local.set $0
  f64.const 1.5
  local.get $0
  f64.convert_i32_s
  call $src_wasm/assembly/combat/wasmPow
  f64.const 100
  f64.mul
  local.set $1
  global.get $src_wasm/assembly/combat/OFF_XP
  f64.load
  local.set $2
  local.get $2
  local.get $1
  f64.ge
  if
   global.get $src_wasm/assembly/combat/OFF_LEVEL
   local.get $0
   i32.const 1
   i32.add
   i32.store
   global.get $src_wasm/assembly/combat/OFF_XP
   local.get $2
   local.get $1
   f64.sub
   f64.store
  end
 )
 (func $src_wasm/assembly/combat/combat_tick (result i32)
  (local $0 i32)
  (local $1 f64)
  (local $2 f64)
  (local $3 f64)
  (local $4 f64)
  (local $5 i32)
  (local $6 f64)
  (local $7 f64)
  (local $8 i32)
  (local $9 f64)
  (local $10 f64)
  (local $11 f64)
  (local $12 f64)
  (local $13 i64)
  (local $14 f64)
  global.get $src_wasm/assembly/combat/OFF_COMBAT_ACTIVE
  i32.load
  local.set $0
  local.get $0
  i32.const 0
  i32.eq
  if
   i32.const 0
   return
  end
  global.get $src_wasm/assembly/combat/OFF_ENEMY_HP
  f64.load
  local.set $1
  local.get $1
  f64.const 0
  f64.le
  if
   global.get $src_wasm/assembly/combat/OFF_COMBAT_ACTIVE
   i32.const 0
   i32.store
   i32.const 2
   return
  end
  global.get $src_wasm/assembly/combat/OFF_ATK
  f64.load
  local.set $2
  global.get $src_wasm/assembly/combat/OFF_CRIT
  f64.load
  local.set $3
  global.get $src_wasm/assembly/combat/OFF_MOMENTUM
  f64.load
  local.set $4
  call $src_wasm/assembly/combat/rngFloat
  local.get $3
  f64.lt
  local.set $5
  local.get $2
  f64.const 1
  local.get $4
  f64.const 0.1
  f64.mul
  f64.add
  f64.mul
  local.set $6
  local.get $5
  if
   local.get $6
   f64.const 2
   f64.mul
   local.set $6
  end
  local.get $1
  local.get $6
  f64.sub
  local.set $7
  global.get $src_wasm/assembly/combat/OFF_ENEMY_HP
  local.get $7
  f64.store
  local.get $7
  f64.const 0
  f64.le
  if
   global.get $src_wasm/assembly/combat/OFF_ENEMY_HP
   f64.const 0
   f64.store
   global.get $src_wasm/assembly/combat/OFF_COMBAT_ACTIVE
   i32.const 0
   i32.store
   global.get $src_wasm/assembly/combat/OFF_ENEMY_LEVEL
   i32.load
   local.set $8
   f64.const 10
   local.get $8
   f64.convert_i32_s
   f64.mul
   local.set $9
   local.get $8
   f64.convert_i32_s
   f64.const 1
   f64.mul
   local.set $10
   global.get $src_wasm/assembly/combat/OFF_XP
   f64.load
   local.set $11
   global.get $src_wasm/assembly/combat/OFF_XP
   local.get $11
   local.get $9
   f64.add
   f64.store
   global.get $src_wasm/assembly/combat/OFF_GOLD
   f64.load
   local.set $12
   global.get $src_wasm/assembly/combat/OFF_GOLD
   local.get $12
   local.get $10
   f64.add
   f64.store
   global.get $src_wasm/assembly/combat/OFF_KILLS
   i64.load
   local.set $13
   global.get $src_wasm/assembly/combat/OFF_KILLS
   local.get $13
   i64.const 1
   i64.add
   i64.store
   global.get $src_wasm/assembly/combat/OFF_MOMENTUM
   f64.load
   local.set $14
   global.get $src_wasm/assembly/combat/OFF_MOMENTUM
   local.get $14
   f64.const 0.01
   f64.add
   f64.store
   call $src_wasm/assembly/combat/checkLevelUp
   i32.const 2
   return
  end
  i32.const 1
  return
 )
 (func $src_wasm/assembly/combat/minF (param $0 f64) (param $1 f64) (result f64)
  local.get $0
  local.get $1
  f64.lt
  if (result f64)
   local.get $0
  else
   local.get $1
  end
  return
 )
 (func $src_wasm/assembly/combat/stats_aggregate (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (param $6 f64) (param $7 f64) (param $8 f64) (param $9 i32)
  (local $10 f64)
  (local $11 f64)
  (local $12 f64)
  (local $13 f64)
  (local $14 f64)
  (local $15 f64)
  (local $16 f64)
  f64.const 10
  local.get $9
  f64.convert_i32_s
  call $src_wasm/assembly/combat/wasmPow
  local.set $10
  local.get $10
  local.get $4
  f64.mul
  local.get $5
  f64.mul
  local.get $6
  f64.mul
  local.get $7
  f64.mul
  local.get $8
  f64.mul
  local.set $11
  global.get $src_wasm/assembly/combat/OFF_MOMENTUM
  f64.load
  local.set $12
  local.get $0
  local.get $11
  f64.mul
  f64.const 1
  local.get $12
  f64.const 0.1
  f64.mul
  f64.add
  f64.mul
  local.set $13
  global.get $src_wasm/assembly/combat/OFF_ATK
  local.get $13
  f64.store
  local.get $1
  local.get $11
  f64.mul
  local.set $14
  global.get $src_wasm/assembly/combat/OFF_DEF
  local.get $14
  f64.store
  local.get $2
  local.get $11
  f64.mul
  local.set $15
  global.get $src_wasm/assembly/combat/OFF_HP
  local.get $15
  f64.store
  global.get $src_wasm/assembly/combat/OFF_MAX_HP
  local.get $15
  f64.store
  local.get $3
  local.get $12
  f64.const 0.01
  f64.mul
  f64.add
  f64.const 0.5
  call $src_wasm/assembly/combat/minF
  local.set $16
  global.get $src_wasm/assembly/combat/OFF_CRIT
  local.get $16
  f64.store
 )
 (func $src_wasm/assembly/combat/world_tick (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i64)
  (local $4 f64)
  (local $5 f64)
  (local $6 i32)
  (local $7 f64)
  (local $8 f64)
  local.get $0
  i32.const 0
  i32.le_s
  if
   i32.const 0
   return
  end
  i32.const 0
  local.set $1
  i32.const 0
  local.set $2
  loop $for-loop|0
   local.get $2
   local.get $0
   i32.lt_s
   if
    global.get $src_wasm/assembly/combat/OFF_TICK_COUNT
    i64.load
    local.set $3
    global.get $src_wasm/assembly/combat/OFF_TICK_COUNT
    local.get $3
    i64.const 1
    i64.add
    i64.store
    global.get $src_wasm/assembly/combat/OFF_MOMENTUM
    f64.load
    local.set $4
    global.get $src_wasm/assembly/combat/OFF_MOMENTUM
    local.get $4
    f64.const 0.01
    f64.add
    f64.store
    global.get $src_wasm/assembly/combat/OFF_MOMENTUM
    f64.load
    f64.const 1e3
    f64.gt
    if
     global.get $src_wasm/assembly/combat/OFF_MOMENTUM
     f64.const 1e3
     f64.store
    end
    global.get $src_wasm/assembly/combat/OFF_XP
    f64.load
    local.set $5
    global.get $src_wasm/assembly/combat/OFF_LEVEL
    i32.load
    local.set $6
    f64.const 1.5
    local.get $6
    f64.convert_i32_s
    call $src_wasm/assembly/combat/wasmPow
    f64.const 100
    f64.mul
    local.set $7
    local.get $5
    local.get $7
    f64.ge
    if
     global.get $src_wasm/assembly/combat/OFF_OVERCHARGE
     f64.load
     local.set $8
     global.get $src_wasm/assembly/combat/OFF_OVERCHARGE
     local.get $8
     f64.const 0.05
     f64.add
     f64.store
     global.get $src_wasm/assembly/combat/OFF_OVERCHARGE
     f64.load
     f64.const 100
     f64.gt
     if
      global.get $src_wasm/assembly/combat/OFF_OVERCHARGE
      f64.const 100
      f64.store
     end
    end
    call $src_wasm/assembly/combat/combat_tick
    local.set $1
    local.get $1
    i32.const 2
    i32.eq
    if
     local.get $6
     call $src_wasm/assembly/combat/combat_spawnEnemy
     drop
     i32.const 1
     local.set $1
    end
    local.get $2
    i32.const 1
    i32.add
    local.set $2
    br $for-loop|0
   end
  end
  local.get $1
  return
 )
 (func $~lib/rt/__visit_globals (param $0 i32)
  (local $1 i32)
  i32.const 6368
  local.get $0
  call $~lib/rt/itcms/__visit
  i32.const 6176
  local.get $0
  call $~lib/rt/itcms/__visit
 )
 (func $~lib/arraybuffer/ArrayBufferView~visit (param $0 i32) (param $1 i32)
  (local $2 i32)
  local.get $0
  local.get $1
  call $~lib/object/Object~visit
  local.get $0
  i32.load
  local.get $1
  call $~lib/rt/itcms/__visit
 )
 (func $~lib/object/Object~visit (param $0 i32) (param $1 i32)
 )
 (func $~lib/rt/__visit_members (param $0 i32) (param $1 i32)
  block $invalid
   block $src_wasm/assembly/decimal/Pair
    block $~lib/arraybuffer/ArrayBufferView
     block $~lib/string/String
      block $~lib/arraybuffer/ArrayBuffer
       block $~lib/object/Object
        local.get $0
        i32.const 8
        i32.sub
        i32.load
        br_table $~lib/object/Object $~lib/arraybuffer/ArrayBuffer $~lib/string/String $~lib/arraybuffer/ArrayBufferView $src_wasm/assembly/decimal/Pair $invalid
       end
       return
      end
      return
     end
     return
    end
    local.get $0
    local.get $1
    call $~lib/arraybuffer/ArrayBufferView~visit
    return
   end
   return
  end
  unreachable
 )
 (func $~start
  memory.size
  i32.const 16
  i32.shl
  global.get $~lib/memory/__heap_base
  i32.sub
  i32.const 1
  i32.shr_u
  global.set $~lib/rt/itcms/threshold
  i32.const 6288
  call $~lib/rt/itcms/initLazy
  global.set $~lib/rt/itcms/pinSpace
  i32.const 6320
  call $~lib/rt/itcms/initLazy
  global.set $~lib/rt/itcms/toSpace
  i32.const 6464
  call $~lib/rt/itcms/initLazy
  global.set $~lib/rt/itcms/fromSpace
 )
 (func $~stack_check
  global.get $~lib/memory/__stack_pointer
  global.get $~lib/memory/__data_end
  i32.lt_s
  if
   i32.const 39376
   i32.const 39424
   i32.const 1
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
 )
 (func $src_wasm/assembly/decimal/Pair#constructor (param $0 i32) (param $1 f64) (param $2 f64) (result i32)
  (local $3 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  local.get $0
  i32.eqz
  if
   global.get $~lib/memory/__stack_pointer
   i32.const 16
   i32.const 4
   call $~lib/rt/itcms/__new
   local.tee $0
   i32.store
  end
  local.get $0
  local.set $3
  global.get $~lib/memory/__stack_pointer
  local.get $3
  i32.store offset=4
  local.get $3
  local.get $1
  call $src_wasm/assembly/decimal/Pair#set:m
  local.get $0
  local.set $3
  global.get $~lib/memory/__stack_pointer
  local.get $3
  i32.store offset=4
  local.get $3
  local.get $2
  call $src_wasm/assembly/decimal/Pair#set:e
  local.get $0
  local.set $3
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $3
 )
 (func $src_wasm/assembly/decimal/decimal_add (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result f64)
  (local $4 i32)
  (local $5 i32)
  (local $6 f64)
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  local.get $0
  local.get $1
  local.get $2
  local.get $3
  call $src_wasm/assembly/decimal/_add
  local.tee $4
  i32.store
  local.get $4
  local.set $5
  global.get $~lib/memory/__stack_pointer
  local.get $5
  i32.store offset=4
  local.get $5
  call $src_wasm/assembly/decimal/Pair#get:m
  local.set $6
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $6
  return
 )
 (func $src_wasm/assembly/decimal/decimal_add_exp (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result f64)
  (local $4 i32)
  (local $5 i32)
  (local $6 f64)
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  local.get $0
  local.get $1
  local.get $2
  local.get $3
  call $src_wasm/assembly/decimal/_add
  local.tee $4
  i32.store
  local.get $4
  local.set $5
  global.get $~lib/memory/__stack_pointer
  local.get $5
  i32.store offset=4
  local.get $5
  call $src_wasm/assembly/decimal/Pair#get:e
  local.set $6
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $6
  return
 )
 (func $src_wasm/assembly/decimal/decimal_sub (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result f64)
  (local $4 i32)
  (local $5 i32)
  (local $6 f64)
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  local.get $0
  local.get $1
  local.get $2
  f64.neg
  local.get $3
  call $src_wasm/assembly/decimal/_add
  local.tee $4
  i32.store
  local.get $4
  local.set $5
  global.get $~lib/memory/__stack_pointer
  local.get $5
  i32.store offset=4
  local.get $5
  call $src_wasm/assembly/decimal/Pair#get:m
  local.set $6
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $6
  return
 )
 (func $src_wasm/assembly/decimal/decimal_sub_exp (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result f64)
  (local $4 i32)
  (local $5 i32)
  (local $6 f64)
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  local.get $0
  local.get $1
  local.get $2
  f64.neg
  local.get $3
  call $src_wasm/assembly/decimal/_add
  local.tee $4
  i32.store
  local.get $4
  local.set $5
  global.get $~lib/memory/__stack_pointer
  local.get $5
  i32.store offset=4
  local.get $5
  call $src_wasm/assembly/decimal/Pair#get:e
  local.set $6
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $6
  return
 )
)
