//ダメージ計算ページのjs
//jsのtextには""を使う。html内は""を使う。

/*** 日本語-英語
 * 加算:sum
 * 乗算:mul
 * 計算:calc calculation
 * 倍率:magn magnification
 * 割合:rate 
 * 係数:coef coefficient
 * 会心値:affi affinity
 * 期待値:exp_val expected value
***/

/*** 用語
 * 表示攻撃力：ゲーム中に表示される攻撃力
 * 武器係数：武器毎に設定されている係数
 * 武器倍率：表示攻撃力を武器係数で割った数値 true attack value
 ***/

/*** 計算式
 * 武器倍率（補正）= ((表示攻撃力 / 武器係数) + (攻撃UPスキル + 護符・爪 + 食事・鬼人薬 + 種・丸薬 + 太刀錬気)) * 笛演奏効果 * 火事場力
 * 物理ダメージ = 武器倍率 * (モーション値 / 100) * 会心期待値 * 斬れ味 * (肉質 / 100)
 * 属性ダメージ = 属性倍率 * 斬れ味 * (耐属性 / 100) * ヒット数
 * 合計ダメージ = (物理ダメージ + 属性ダメージ) ＊端数切捨
 * 最終ダメージ = (合計ダメージ * 防御率) ＊端数切捨
***/


/* Constants ******************************************************************/

//武器係数
const WEAPON_COEF_DICT = {
    "大剣": 4.8,
    "太刀": 3.3,
    "片手剣": 1.4,
    "双剣": 1.4,
    "ハンマー": 5.2,
    "狩猟笛": 5.2,
    "ランス": 2.3,
    "ガンランス": 2.3,
    "スラッシュアックス": 5.4,
    "チャージアックス": 3.6,
    "操虫棍": 3.1,
}


/** 大剣
 *  {dmg_type: "切断or打撃or弾", motion_val: val, 
 *  斬れ味補正: val, 属性補正: val}
 */
const GS_DICT = {
    "[抜刀]縦斬り": 
        {dmg_type: "切断", motion_val: 48, sharp_up: 1, ele_up: 1},
    "縦斬り": 
        {dmg_type: "切断", motion_val: 48, sharp_up: 1, ele_up: 1},
    "斬り上げ": 
        {dmg_type: "切断", motion_val: 46, sharp_up: 1, ele_up: 1},
    "なぎ払い": 
        {dmg_type: "切断", motion_val: 36, sharp_up: 1, ele_up: 1},
    "横殴り": 
        {dmg_type: "打撃", motion_val: 18, sharp_up: 1, ele_up: 1},
    "溜め1": 
        {dmg_type: "切断", motion_val: 65, sharp_up: 1.1, ele_up: 1.2},
    "溜め2/溜めすぎ": 
        {dmg_type: "切断", motion_val: 77, sharp_up: 1.2, ele_up: 1.5},
    "溜め3": 
        {dmg_type: "切断", motion_val: 110, sharp_up: 1.3, ele_up: 2},
    "強溜め0": 
        {dmg_type: "切断", motion_val: 52, sharp_up: 1, ele_up: 1},
    "強なぎ払い": 
        {dmg_type: "切断", motion_val: 48, sharp_up: 1, ele_up: 1},
    "強溜め1": 
        {dmg_type: "切断", motion_val: 70, sharp_up: 1.1, ele_up: 1.8},
    "強なぎ払い1": 
        {dmg_type: "切断", motion_val: 52, sharp_up: 1, ele_up: 1},
    "強溜め2": 
        {dmg_type: "切断", motion_val: 85, sharp_up: 1.2, ele_up: 2.25},
    "強なぎ払い2": 
        {dmg_type: "切断", motion_val: 66, sharp_up: 1, ele_up: 1},
    "強溜め3": 
        {dmg_type: "切断", motion_val: 115, sharp_up: 1.3, ele_up: 3},
    "強なぎ払い3": 
        {dmg_type: "切断", motion_val: 110, sharp_up: 1, ele_up: 1},
    "ジャンプ攻撃": 
        {dmg_type: "切断", motion_val: 48, sharp_up: 1, ele_up: 1},
    "ジャンプ後なぎ払い": 
        {dmg_type: "切断", motion_val: 66, sharp_up: 1, ele_up: 1},
}


/** 太刀 
 *  {モーション名: [モーション値, ヒット数]}
 *  */
const LS_DICT = {
    "[抜刀]踏み込み斬り": {dmg_type: "切断", motion_val: [26]},
    "踏み込み斬り": {dmg_type: "切断", motion_val: [26]},
    "縦斬り": {dmg_type: "切断", motion_val: [23]},
    "突き": {dmg_type: "切断", motion_val: [14]},
    "斬り上げ": {dmg_type: "切断", motion_val: [18]},
    "斬り下がり/左右移動斬り": {dmg_type: "切断", motion_val: [24]},
    "気刃斬り1（錬気不足）": {dmg_type: "切断", motion_val: [16]},
    "気刃斬り1": {dmg_type: "切断", motion_val: [28]},
    "気刃斬り2": {dmg_type: "切断", motion_val: [30]},
    "気刃斬り3": {dmg_type: "切断", motion_val: [12, 14, 34]}, // 60
    "気刃大回転斬り": {dmg_type: "切断", motion_val: [42]},
    "気刃踏込斬り(錬気不足)": {dmg_type: "切断", motion_val: [18]},
    "気刃踏込斬り": {dmg_type: "切断", motion_val: [30]},
    "ジャンプ斬り": {dmg_type: "切断", motion_val: [26]},
    "ジャンプ気刃斬り": {dmg_type: "切断", motion_val: [30]},
    "ジャンプ気刃2連斬り": {dmg_type: "切断", motion_val: [12, 36]}
}


const SnS_DICT = {
    /** 片手剣
     * {モーション名: { dmg_type: ダメージタイプ, motion_val: モーション値 } */
    "【抜刀】突進斬り": { dmg_type: "切断", motion_val: 18 },
    "斬り上げ": { dmg_type: "切断", motion_val: 14 },
    "斬り下ろし": { dmg_type: "切断", motion_val: 14 },
    "横斬り": { dmg_type: "切断", motion_val: 13 },
    // 気絶値15 減気値15
    "剣盾コンボ盾": { dmg_type: "打撃", motion_val: 10 },
    "剣盾コンボ剣": { dmg_type: "切断", motion_val: 20 },
    "水平斬り": { dmg_type: "切断", motion_val: 21 },
    "斬り返し": { dmg_type: "切断", motion_val: 19 },
    "盾攻撃": { dmg_type: "打撃", motion_val: 6 },
    "バックナックル": { dmg_type: "打撃", motion_val: 16 },
    "ガード攻撃": { dmg_type: "切断", motion_val: 14 },
    "溜め斬り盾": { dmg_type: "打撃", motion_val: 20 }, // 気絶値15 減気値25
    "溜め斬り剣": { dmg_type: "切断", motion_val: 37 },
    "ジャンプ斬り": { dmg_type: "切断", motion_val: 20 },
    "ジャンプ突進斬り": { dmg_type: "切断", motion_val: 20 },
    "ジャンプ斬り上げ": { dmg_type: "切断", motion_val: 18 },
}

/** 双剣 
 *  {モーション名:{
        dmg_type: ダメージタイプ, 
        motion_arr: 
            [{val: モーション値, hits: ヒット数, duals: 両手攻撃属性補正}], 
        demon_flag: 鬼人化フラグ},
 *  鬼人化フラグ: 通常状態のみ:0, 鬼人化でも使える:1 鬼人化専用:2
 *  両手攻撃属性補正: 通常:1, 両手:0.7
 *  両手攻撃の属性補正はモーション全体にかかるのではなく、
 *  両手攻撃のヒット時のダメージ計算にかかる */
const DB_DICT = {
    "[抜刀]斬り払い": {
        dmg_type: "切断", 
        motion_arr: [{val: 7, hits: 2, duals: 0.7},
                    {val: 7, hits: 2, duals: 0.7}], 
        demon_flag: 1},
    "鬼人突進連斬": {
        dmg_type: "切断",
        motion_arr: [{val: 7, hits: 4, duals: 1},
                    {val: 9, hits: 2, duals: 0.7}],
        demon_flag: 1}, // 46 52
    "斬り上げ": {
        dmg_type: "切断",
        motion_arr: [{val: 18, hits: 1, duals: 1}],
        demon_flag: 1}, // 20
    "二段斬り": {
        dmg_type: "切断",
        motion_arr: [{val: 8, hits: 1, duals: 1},
                    {val: 12, hits: 1, duals: 1}],
        demon_flag: 0}, // 20 
    "斬り返し": {
        dmg_type: "切断",
        motion_arr: [{val: 7, hits: 1, duals: 1},
                    {val: 10, hits: 1, duals: 1}], 
        demon_flag: 0}, // 17
    "車輪斬り": {
        dmg_type: "切断",
        motion_arr: [{val: 10, hits: 1, duals: 1},
                    {val: 12, hits: 2, duals: 0.7}],
        demon_flag: 1}, // 34 37
    "六連斬り": {
        dmg_type: "切断",
        motion_arr: [{val: 4, hits: 2, duals: 1},
                    {val: 8, hits: 2, duals: 1},
                    {val: 11, hits: 2, duals: 0.7}],
        demon_flag: 2}, // 46 50 鬼人化専用
    "右二連斬り": {
        dmg_type: "切断", 
        motion_arr: [{val: 7, hits: 1, duals: 1},
                    {val: 10, hits: 1, duals: 1}],
        demon_flag: 0}, // 17
    "左二連斬り": {
        dmg_type: "切断",
        motion_arr: [{val: 9, hits: 1, duals: 1},
                    {val: 12, hits: 1, duals: 1}],
        demon_flag: 0}, // 21
    "回転斬りα": {
        dmg_type: "切断",
        motion_arr: [{val: 16, hits: 1, duals: 1},
                    {val: 6, hits: 1, duals: 1},
                    {val: 8, hits: 1, duals: 1}],
        demon_flag: 1}, // 30 33
    "回転斬りβ": {
        dmg_type: "切断",
        motion_arr: [{val: 18, hits: 1, duals: 1},
                    {val: 6, hits: 1, duals: 1},
                    {val: 10, hits: 1, duals: 1}],
        demon_flag: 1}, // 34 37
    "鬼人連斬": {
        dmg_type: "切断", 
        motion_arr: [{val: 8, hits: 2, duals: 0.7},
                    {val: 8, hits: 2, duals: 1},
                    {val: 6, hits: 2, duals: 1},
                    {val: 20, hits: 2, duals: 0.7}],
        demon_flag: 0}, // 72 
    "乱舞": { // 97 105 鬼人化専用
        dmg_type: "切断",
        motion_arr: [{val: 29, hits: 1, duals: 1},
                    {val: 4, hits: 8, duals: 1},
                    {val: 18, hits: 2, duals: 0.7}],
        demon_flag: 2}, 
    "ジャンプ二連斬り": {
        dmg_type: "切断",
        motion_arr: [{val: 10, hits: 1, duals: 1},
                    {val: 13, hits: 1, duals: 1}],
        demon_flag: 1}, // 23 25
    "空中回転乱舞": {
        dmg_type: "切断",
        motion_arr: [{val: 12, hits: 2, duals: 1},
                    {val: 15, hits: 2, duals: 1}],
        demon_flag: 1}, // 54 60
    "回転乱舞フィニッシュ": {
        dmg_type: "切断",
        motion_arr: [{val: 23, hits: 2, duals: 1}],
        demon_flag: 1} // 46 52
}

/** ハンマー 
 *  {モーション名: [モーション値, ヒット数]} */
const HAMMER_DICT = {
    "[抜刀]振り上げ": [20, 1],
    "横振り": [15, 1],
    "縦振り": [42, 1],
    "縦振り連打": [20, 1],
    "アッパー": [90, 1],
    "溜めI": [25, 1],
    "溜めI追加攻撃": [20, 1],
    "溜めII": [40, 1],
    "溜めIII": [91, 2], // 15 + 76
    "回転攻撃": [[20, 10], 6], // 20+10*n nはヒット数、最大6
    "ぶんまわし": [60, 1],
    "ジャンプ攻撃": [42, 1],
    "ジャンプ溜めI": [65, 1],
    "ジャンプ溜めII": [70, 1],
    "ジャンプ溜めIII": [80, 1]
}

const HH_DICT = {
    "[抜刀]前方攻撃":33,
    "ぶん回し":30,
    "ツカ攻撃":10, //斬撃
    "連音攻撃1":12,
    "連音攻撃2":22,
    "後方攻撃":45,
    "叩きつけ1":15,
    "叩きつけ2":45,
    "[抜刀]ジャンプ叩きつけ":36,
    "[抜刀]演奏":35,
    "演奏(前方攻撃後)":20,
    "演奏(ツカ攻撃後)":25,
    "追加演奏(後方)1":40,
    "追加演奏(後方)2":30,
    "追加演奏(左右)":35,
    "自分強化以外の追加演奏初撃":33,
}

/** ランス
 *  {モーション名:モーション値}
 *  攻撃属性: 切断
 *  未実装 特徴:切断と打撃のうち高い方の肉質を計算に使う */
const LANCE_DICT = {
    "[抜刀]武器出し攻撃":
        {dmg_type: "突き", motion_val: 23},
    "中段突き1,2":
        {dmg_type: "突き", motion_val: 20},
    "中段突き3":
        {dmg_type: "突き", motion_val: 27},
    "上段突き1,2":
        {dmg_type: "突き", motion_val: 22},
    "上段突き3":
        {dmg_type: "突き", motion_val: 27},
    "なぎ払い":
        {dmg_type: "突き", motion_val: 20},
    "突進(*n回)":
        {dmg_type: "突き", motion_val: 16},
    "フィニッシュ突き":
        {dmg_type: "突き", motion_val: 50},
    "突進ジャンプ突き":
        {dmg_type: "突き", motion_val: 50},
    "振り向き攻撃":
        {dmg_type: "突き", motion_val: 50},
    "キャンセル突き":
        {dmg_type: "突き", motion_val: 22},
    "カウンター突き":
        {dmg_type: "突き", motion_val: 50},
    "[抜刀]ジャンプ突き":
        {dmg_type: "突き", motion_val: 30},
    "ジャンプ突き":
        {dmg_type: "突き", motion_val: 30},
    "ガード突き":
        {dmg_type: "突き", motion_val: 20},
    "盾攻撃":
        {dmg_type: "打撃", motion_val: 14} // 気絶値 27, 減気値27
}

/** ガンランス */
const GL_DICT = {
    "[抜刀]踏み込み突き上げ": {dmg_type: "切断", motion_val: 32},
    "踏み込み突き上げ": {dmg_type: "切断", motion_val: 32},
    "砲撃派生突き上げ": {dmg_type: "切断", motion_val: 30},
    "斬り上げ": {dmg_type: "切断", motion_val: 28},
    "上方突き": {dmg_type: "切断", motion_val: 18},
    "水平突き": {dmg_type: "切断", motion_val: 24},
    "叩きつけ": {dmg_type: "切断", motion_val: 40},
    "ジャンプ叩きつけ": {dmg_type: "切断", motion_val: 44},
    "ジャンプ突き": {dmg_type: "切断", motion_val: 25},
    "砲撃": {hits: 1},
    "溜め砲撃": {hits: 1},
    "フルバースト": {hits: 6},
    "竜撃砲": {hits: 4}
}

/** ガンランスの砲撃ダメージ
 *  {砲撃タイプ: [[Lv1ダメ, 火ダメ], [Lv2ダメ, 火ダメ], ...]} */
const GL_SHELL_TYPES = {
    "通常": [[10, 4], [14, 5], [18, 6], [21, 7], [24, 8]],
    "放射": [[15, 9], [21, 11], [28, 14], [32, 16], [36, 18]],
    "拡散": [[20, 6], [30, 8], [40, 10], [44, 11], [48, 12]],
    //最大4ヒット
    "竜撃砲": [[30, 10], [35, 11], [40, 12], [45, 13], [50, 14]]
}

/** 操虫棍 Insect Glaive
 *  {モーション名:[[通常モーション値], 通常ヒット数, 赤エキスフラグ]}
 *  赤エキスフラグ: 赤エキス時に存在するモーションかどうか。0なら不在, 1なら存在*/
const IG_DICT = {
    "突き": [[15], 1, 0],
    "突き（赤）": [[18, 12], 2, 1],
    "なぎ払い": [[36], 1, 0],
    "なぎ払い（赤）": [[18, 30], 2, 1],
    "なぎ払い斬り上げ派生時（赤）": [[18, 30, 28], 3, 1],
    "[抜刀]飛び込み斬り": [[28], 1, 1],
    "回転斬り": [[20], 1, 1],
    "叩きつけ": [[30], 1, 0], // 赤エキス時は飛燕斬り
    "飛燕斬り（赤）":[[24, 38], 2, 1],
    "連続斬り上げ": [[26, 20], 2, 0],
    "連続斬り上げ（赤）":[[28, 16, 18], 3, 1],
    "けさ斬り": [[24], 1, 0],
    "けさ斬り（赤）": [[16, 26], 2, 1],
    "二段斬り": [[18, 24], 2, 0],
    "二段斬り（赤）":[[16, 14, 28], 3, 1],
    "印当て": [[12], 1, 1],
    "ジャンプ斬り": [[24], 1, 0],
    "ジャンプ斬り（赤）":[[20, 10], 2, 1],
    "猟虫": [[45], 1, 1],
    "虫回転攻撃": [[80], 1, 1]  // 属性補正1.5倍
}

/** スラッシュアックス SA Switch Axe
 *  {モーション名: [0:[モーション値], 1:ヒット数]} */
const SA_DICT = {
    "斧:[抜刀]横斬り": {dmg_type: "切断", motion_val: [23]},
    "斧:縦斬り": {dmg_type: "切断", motion_val: [40]},
    "斧:斬り上げ": {dmg_type: "切断", motion_val: [28]},
    // 振り回しダメージはダメージ*n回
    "斧:振りまわし(*n回)": {dmg_type: "切断", motion_val: [24]},
    "斧:なぎ払いフィニッシュ": {dmg_type: "切断", motion_val: [57]},
    "斧:突進斬り": {dmg_type: "切断", motion_val: [19]},
    "斧:変形斬り": {dmg_type: "切断", motion_val: [30]},
    "斧:ジャンプ斬り": {dmg_type: "切断", motion_val: [43]},
    "剣:変形斬り": {dmg_type: "切断", motion_val: [23]},
    "剣:[抜刀]縦斬り": {dmg_type: "切断", motion_val: [30]},
    "剣:斬り上げ": {dmg_type: "切断", motion_val: [25]},
    "剣:横切り": {dmg_type: "切断", motion_val: [25]},
    "剣:二連斬り":{dmg_type: "切断", motion_val: [28, 36]},
    "剣:属性解放突き": {dmg_type: "切断", motion_val: [28]},
    "剣:属性解放継続(*1~6)": {dmg_type: "切断", motion_val: [13]},
    "剣:属性解放任意フィニッシュ": {dmg_type: "切断", motion_val: [50]},
    "剣:属性解放フィニッシュ": {dmg_type: "切断", motion_val: [80]},
    "剣:ジャンプ斬り": {dmg_type: "切断", motion_val: [43]},
    "剣:ジャンプ変形斬り": {dmg_type: "切断", motion_val: [43]},
    "剣:ジャンプ属性解放突き": {dmg_type: "切断", motion_val: [28]},
}

/** チャージアックス 全て切断属性
  *  {dmg_type:攻撃タイプ, motion_val:[モーション値1, 2],
    boost_motion_magn: 属性強化モーション倍率,  2:榴弾爆発係数, 3:強属性爆発係数, 4:爆発回数 }
 * 属性強化で変化するモーションかどうかのフラグを入れてもいいかも*/
const CB_DICT = {
    "剣:突進斬り": 
        {dmg_type: "切断", motion_val: [22], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:牽制斬り": 
        {dmg_type: "切断", motion_val: [14], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:斬り返し": 
        {dmg_type: "切断", motion_val: [17], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:溜め斬り上げ": 
        {dmg_type: "切断", motion_val: [16], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:溜め２連斬り": 
        {dmg_type: "切断", motion_val: [30, 20], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:回転斬り": 
        {dmg_type: "切断", motion_val: [30], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:チャージ斬り返し": 
        {dmg_type: "切断", motion_val: [17], impact_phial_coef: 0.02, ele_phial_coef: 2.5,
        num_of_impacts: 1},
    "剣:盾突き": 
        {dmg_type: "切断", motion_val: [8, 12], impact_phial_coef: 0.05, ele_phial_coef: 2.5, num_of_impacts: 1},
    "剣:ジャンプ斬り":
        {dmg_type: "切断", motion_val: [22], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:GP爆発":
        {dmg_type: "切断", motion_val: [], impact_phial_coef: 0.05, ele_phial_coef: 2.5, num_of_impacts: 1},
    "斧:叩きつけ":
        {dmg_type: "切断", motion_val: [47], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:斬り上げ": 
        {dmg_type: "切断", motion_val: [40], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:縦斬り": 
        {dmg_type: "切断", motion_val: [40], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:横斬り": 
        {dmg_type: "切断", motion_val: [20], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:属性解放斬りI:ビン有": 
        {dmg_type: "切断", motion_val: [26], impact_phial_coef: 0.05, ele_phial_coef: 3.0, num_of_impacts: 1},
    "斧:属性解放斬りII:ビン有": 
        {dmg_type: "切断", motion_val: [18, 80],
        impact_phial_coef: 0.05, ele_phial_coef: 3.0,
        num_of_impacts: 2},
    "斧:高出力属性解放斬り:ビン有": 
        {dmg_type: "切断", motion_val: [90], impact_phial_coef: 0.1, ele_phial_coef: 4.5, num_of_impacts: 3},
    // あえて属性強化前のモーション値をかくと [21, 83, 84] 榴弾ビン倍率は0.33かもしれない
    "斧:超高出力属性解放斬り:ビン1": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5, 
        num_of_impacts: 1},
    "斧:超高出力属性解放斬り:ビン2": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5, 
        num_of_impacts: 2},
    "斧:超高出力属性解放斬り:ビン3": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5, 
        num_of_impacts: 3},
    "斧:超高出力属性解放斬り:ビン4": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5, 
        num_of_impacts: 4},
    "斧:超高出力属性解放斬り:ビン5": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5,
        num_of_impacts: 5},
    "斧:超高出力属性解放斬り:ビン6": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5,
        num_of_impacts: 6},
    "斧:ジャンプ叩きつけ": 
        {dmg_type: "切断", motion_val: [47], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:属性解放斬りI:ビン無": 
        {dmg_type: "切断", motion_val: [14], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:属性解放斬りII:ビン無": 
        {dmg_type: "切断", motion_val: [14, 47], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:高出力属性解放斬り:ビン無":
        {dmg_type: "切断", motion_val: [40], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:超高出力属性解放斬り:ビン無":
        {dmg_type: "切断", motion_val: [17, 90], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0}
}


//斬れ味の色と補正値のマップ
//物理補正値
const PHYS_SHARP_DICT = {
    "赤" : 0.5,
    "橙" : 0.75,
    "黄" : 1.0,
    "緑" : 1.05,
    "青" : 1.2,
    "白" : 1.32,
    "紫" : 1.45
}

//属性補正値
const ELE_SHARP_DICT = {
    "赤" : 0.25,
    "橙" : 0.5,
    "黄" : 0.75,
    "緑" : 1.0,
    "青" : 1.0625,
    "白" : 1.125,
    "紫" : 1.2
}


/* Functions ******************************************************************/

/** 2つのdictが同じかどうかを調べる
 *  return bool */
function is_same_dict(a, b){
    if(JSON.stringify(a) == JSON.stringify(b)){
        return true
    }else{
        return false
    }
}

/** １の位を切り下げ */
function truncate_ones_place(x){
    return Math.floor(x/10) * 10
}

/** 少数第y位より下を切り捨て
 *  x: 切り捨てられる値
 *  y: 残す位 default=1
 *  例:1.234
 *     yを指定しなければ少数第一位までになる     
 *     1.23 にしたいときは y=2 */
function truncate_decimal_place(x, y=1){
    return Math.floor(x*10**y) / 10**y 
}

/** 引数を全て加算して返す */
function sum(){
    let x = 0,
        i
    for(i = 0; i < arguments.length; i++){
        x += arguments[i]
    }
    return x
}

/** Arrayの全要素を加算して返す */
function sum_array(x){
    let y = 0,
        i
    for (i = 0; i < x.length; i++){
        y += x[i]
    }
    return y
}

/** 引数を全て乗算して積を返す */
function mul(){
    let x = 1,
        i
    for(i = 0; i < arguments.length; i++){
        x *= arguments[i]
    }
    return x
}

function mul_array(x){
    let y = 1,
        i
    for (i = 0; i < x.length; i++){
        y *= x[i]
    }
    return y
}


/** 武器倍率の計算
 * (表示攻撃力 / 武器係数) */
function calc_weapon_magn(atk, weapon_coef){
    return atk / weapon_coef
}

/** 会心期待値の計算
 ** (1.0 + (会心倍率 - 1.0) * 会心率 / 100.0)
 ** 引数magnを指定すれば会心時の倍率を変えられる */
function calc_affi_exp(affi, magn=1.25){
    return (1.0 + (magn - 1.0) * affi / 100)
}

/** 計算結果をresult tableに出力 */
function output_result_table(table, dict){
    let thead = $("<thead>"),
        tbody = $("<tbody>"),
        h_row = $("<tr>"),
        i = 0

    table.empty()
    h_row.append($("<th>").text("モーション"))
    for(m in dict){
        let b_row = $("<tr>")
        b_row.append($("<td>").text(m))
        for(p in dict[m]){
            if(i == 0){
                h_row.append($("<th>").text(p))
            }
            let td = $("<td>")
            let text = ""
            for(let i = 0; i < dict[m][p].length; i++){
                if(i == 0){
                    text += dict[m][p][i]["合計"]
                }else{
                    text += "\n(" + dict[m][p][i]["合計"] +")"
                }
                td.text(text)
            }
            b_row.append(td)
        }
        tbody.append(b_row)
        i++
    }
    thead.append(h_row)
    table.append(thead, tbody)
    return 0
}

/* イベント ************************************************************/

/** 武器種が変更されたら、選択された武器種の武器を武器名selectに入れる 
 *  section: section .weapon
 *  type: weapon_type */
function set_weapon_select(){
    console.log("武器種を変更")
    let type = $("option:selected", this).text(),
        section = $(this).parents().find(".weapon")
        select = section.find(".weapon_name select")
        ele_type = section.find(".ele_type select option:selected").val()
        awake = Number($(this).parents()
            .find(".awaken select option:selected").val())
    
    // 既存の.weapon_name optionを削除
    select.empty()
    
    // 武器名selectに武器名を追加
    $.getJSON("weapon_data.json", function(data){
        if(ele_type){
            // 属性指定あり
            if(awake){
                // 属性解放スキルがONなら"ele_type"か"awake_ele_type"が ele_typeと同じなら追加する
                for(let w in data[type]){
                    if(ele_type == data[type][w]["ele_type"]
                        || ele_type
                            == data[type][w]["awake_ele_type"]){
                        let option = $("<option>")
                        option.text(w)
                        select.append(option)
                    }
                }
            }else{
                // 属性解放スキルがOFFなら"ele_type"とele_typeが同じものだけ追加
                for(let w in data[type]){
                    if(ele_type == data[type][w]["ele_type"]){
                        let option = $("<option>")
                        option.text(w)
                        select.append(option)
                    }
                }
            }
        }else{
            // 属性指定なし
            for(let w in data[type]){
                let option = $("<option>")
                option.text(w)
                select.append(option)
            }
        }
        
    })
    
    // 武器種に依存するhtmlを隠す
    section.find(".center_of_blade").hide()
    section.find(".p_type").hide()
    section.find(".boost_mode").hide()
    section.find(".spirit_full").hide()
    section.find(".spirit_color").hide()
    section.find(".demon_mode").hide()
    section.find(".shell_types").hide()
    section.find(".shelling_lv").hide()
    section.find(".essences").hide()
    section.find(".sa_p_types").hide()

    // 武器種ごとに処理
    switch(type){
        case "大剣":
            // 中腹ヒットhtmlを表示
            section.find(".center_of_blade").show()
            break
        case "太刀":
            // 中腹ヒットhtmlを表示
            section.find(".center_of_blade").show()
            section.find(".spirit_full").show()
            section.find(".spirit_color").show()
            break
        case "スラッシュアックス":
            section.find(".sa_p_types").show()
            break
        case "チャージアックス":
            // ビン選択と属性強化状態のselect
            section.find(".p_type").show()
            section.find(".boost_mode").show()
            break
        case "双剣":
            section.find(".demon_mode").show()
            break
        case "ガンランス":
            section.find(".shell_types").show()
            section.find(".shelling_lv").show()
            break
        case "操虫棍":
            section.find(".essences").show()
            break
    }

    return false
}


/** 属性セレクト.ele_type selectが選択されたら、
 *  選択された属性の武器を武器名セレクトに出力 */
function select_ele_type(){
    // section .input と 属性タイプ と 武器種を取得
    let awaken = Number(
            $(this).parents().find(".awaken select option:selected").val()),
        ele_type = $("option:selected", this).val(),
        type = $(this).parents()
            .find(".weapon_types select option:selected").text()
    
    // .weapon_name select の子要素を削除
    $(this).parents().find(".weapon_name select").empty()

    // 新しい子要素を追加
    $.getJSON("weapon_data.json", function(data){
        if (ele_type){
            // ele_typeが指定された場合
            if (awaken){
                // 属性解放スキルがonの時
                for(let w in data[type]){
                    // "ele_type"か"awake_ele_type"のどちらかがele_typeなら武器名を武器selectへ
                    if(ele_type == data[type][w]["ele_type"]
                    || ele_type ==  data[type][w]["awake_ele_type"]){
                        let option = $("<option>")
                        option.text(w)
                        select.append(option)
                    }
                }
            }else{
                for(let w in data[type]){
                    // 属性解放スキルがoffの時 指定されたele_typeの武器名をselectへ
                    if (ele_type == data[type][w]["ele_type"]){
                        let option = $("<option>")
                        option.text(w)
                        select.append(option)
                    }
                }
            }
        }else{
            // 指定されなかった場合 該当武器種の全武器を出力
            for(let w in data[type]){
                let option = $("<option>")
                option.text(w)
                select.append(option)
            }
        }
    })
}


/** 武器が選択されたら動く
 *  武器データをjsonから取得し、各inputに入力する
 *  awaken: 属性解放フラグ
 *  sharp_plus: 匠スキルフラグ
 *  section: section .weapon
 *  type: weapon_type */
function input_weapon_data(){
    let input_sect = $(this).parents().find(".input"),
        type = input_sect
            .find(".weapon_types select option:selected").text(),
        name = $("option:selected", this).text(),
        ele_type = "ele_type",
        ele_val =  "ele_val",
        sharp = "sharp"

    // 属性解放スキル
    if(Number(input_sect.find(".awaken select option:selected").val())){
        // ONなら"awake_" + ele_type & ele_val
        ele_type = "awake_" + ele_type
        ele_val = "awake_" + ele_val
    }
    // 匠スキル
    if(Number(input_sect.find(".sharp_plus select option:selected").val())){
        // ONなら sharp + "+"
        sharp + "+"
    }
    
    // 武器種と武器名から各武器データを取得し、inputに入力
    $.getJSON("weapon_data.json", function(data){
        // 表示攻撃力
        input_sect.find(".attack input")
            .val(data[type][name]["atk"])
        // 属性種
        input_sect.find(".ele_type select").val(data[type][name][ele_type])

        // 特殊属性のダメージ計算には未対応なので、ele_typeが特殊属性ならele_valを0にする。対応したら消しましょう。
        if(data[type][name][ele_type] == ("麻"||"毒"||"眠"||"爆")){
            // 表示属性値
            input_sect.find(".element input").val(0)
        }else{
            // 表示属性値
            input_sect.find(".element input").val(data[type][name][ele_val])
        }
        // 斬れ味
        input_sect.find(".sharpness select").val(data[type][name][sharp])
        // 会心率
        input_sect.find(".affinity input").val(data[type][name]["affi"])

        // 武器種毎の処理
        switch(type){
            case "ガンランス": {
                input_sect.find(".shell_types select").val(data[type][name]["shell_type"])
                input_sect.find(".shelling_lv select").val(data[type][name]["shell_lv"])
                break
            }
            case "スラッシュアックス": {
                input_sect.find(".sa_p_type select")
                    .val(data[type][name]["phial"])
                break
            }
                
            case "チャージアックス": {
                input_sect.find(".p_type select")
                    .val(data[type][name]["phials"])
                break
            }
        }
    })
}


/** 匠スキルが変更されたら斬れ味を変える
 *  type: weapon_type
 *  name: weapon_name */ 
function update_sharpness(){
    let sharp,
        sharp_key = "sharp",
        weapon_sect = $(this).parents().find(".weapon"),
        type = 
            weapon_sect.find(".weapon_types select option:selected").text(),
        name = weapon_sect.find(".weapon_name option:selected").text()
    
    // 匠スキルがONかOFFか調べ、ONならsharp_keyに"+"を追加
    if(Number($("option:selected", this).val())){
        sharp_key += "+"
    }

    $.getJSON("weapon_data.json", function(data){
        weapon_sect.find(".sharpness select").val(data[type][name][sharp_key])
    })
}


/** 属性解放スキルが選択されたら、属性を更新する */
function update_element(){
    let ele_type = "ele_type",
        ele_val = "ele_val",
        section = $(this).parents().find(".input"),
        type = section.find(".weapon_types select option:selected").text(),
        name = section.find(".weapon_name option:selected").text()
    
    if(Number($("option:selected", this).val())){
        ele_type = "awake_" + ele_type
        ele_val = "awake_" + ele_val
    }

    $.getJSON("weapon_data.json", function(data){
        if(data[type][name][ele_type]){
            section.find(".ele_type select").val(data[type][name][ele_type])
            // 特殊属性のダメージ計算には未対応なので、ele_typeが特殊属性ならele_valを0にする。対応したら消しましょう。
            if(data[type][name][ele_type] == ("麻"||"毒"||"眠"||"爆")){
                // 表示属性値
                section.find(".element input").val(0)
            }else{
                // 表示属性値
                section.find(".element input").val(data[type][name][ele_val])
            }
        }else{
            // なければ0を返す
            return 0
        }
        
    })
}


/** スキルが選ばれたらlabelの文字色を変える */
function select_skills(){
    if($("option:selected", this).text() == "なし"){
        // なしが選択されたら文字色を白く
        $(this).prev().css("color", "white")
    }else{
        $(this).prev().css("color", "orange")
    }
}

/** monster_data.jsonからモンスター名を取りモンスター名セレクトに入力する関数 */
function monster_name_to_select(){
    let select = $(".monster select")
    $.getJSON("monster_data.json", function(data){
        for(m in data){
            let option = $("<option>")
            option.text(m)
            select.append(option)
        }
    })
}

/** モンスターが選択されたらモンスターデータのテーブルを表示 */
function output_monster_data_table(){
    let monster = $("option:selected", this).text(),
        table = $(this).parents().find(".monster_table")
        thead = $("<thead>"),
        tbody = $("<tbody>")
    
    // tbodyの中身をリセット
    table.empty()

    $.getJSON("monster_data.json", function(data){
        let i = 0
        // テーブルヘッド
        let h_row = $("<tr>")
        h_row.append($("<th>").text(""))
        for(part in data[monster]){
            let row = $("<tr>")
            row.append($("<td>").text(part))
            for(dmg_type in data[monster][part]){
                if(i == 0){
                    h_row.append($("<th>").text(dmg_type))
                }
                let td = $("<td>")
                // 各攻撃属性の値（配列）の要素数を確認
                if(data[monster][part][dmg_type].length == 1){
                    // 配列の長さが1の場合、0こ目の要素をそのままtdへ入力
                    td.text(String(data[monster][part][dmg_type][0]))
                }else{
                    // 配列の長さが二つ以上のなら
                    // "配列[0](配列[1])"という形でtdに入力
                    td.text(
                        String(data[monster][part][dmg_type][0]) + 
                        "("+ String(data[monster][part][dmg_type][1]) +")"
                    )
                }
                row.append(td)
            }
            tbody.append(row)
            i++
        }
        thead.append(h_row)
        table.append(thead, tbody)
    })
}


/** 計算ボタンが押されたら動く。計算する */
function click_calc_botton(){
    console.log("計算ボタン")
    // section .input
    let section = $(this).parents().find(".input")
    // 入力値を取得
    // 武器種を取得
    let weapon_type = 
        section.find(".weapon_types select option:selected").text()
    // 武器倍率を取得
    let weapon_magn = calc_weapon_magn(
        section.find(".attack input").val(),
        WEAPON_COEF_DICT[weapon_type])
    // 属性倍率を取得
    let ele_val = Number(section.find(".element input").val())
    // 会心率を取得
    let affinity = Number(section.find(".affinity input").val())
    // 斬れ味物理補正値を取得
    let phys_sharp_magn = PHYS_SHARP_DICT[
        section.find(".sharpness select option:selected").val()
    ]
    //斬れ味属性補正値を取得
    let ele_sharp_magn = ELE_SHARP_DICT[
        section.find(".sharpness select option:selected").val()
    ]

    // 肉質関連の変数
    // 肉質はモーションごとに取得する必要がある
    // 耐属性も部位ごとに取得
    
    // 属性タイプを取得
    let ele_type = 
        section.find(".ele_type select option:selected").val()
    
    
    // 防御率の取得
    let defense_rate = Number(section.find(".defense_rate").val())
    defense_rate /= 100


    /* 加算スキル（武器倍率に加算するスキル）************************************/
    let sum_skills = []
    // 極限強化・攻撃
    sum_skills.push(Number(
        section.find(".honing option:selected").val()))

    // 攻撃up
    sum_skills.push(Number(
        section.find(".atk_up option:selected").val()))

    // 無傷（フルチャージ）
    sum_skills.push(Number(
        section.find(".peak_performance option:selected").val()))

    // 闘魂（挑戦者）
    let challenger = section.find(".challenger option:selected").val().split(",")
    sum_skills.push(Number(challenger[0]))
    affinity += Number(challenger[1])


    /* 乗算スキル 武器倍率に乗算するスキル *************************************/
    let mul_skills = []
    // 火事場力（倍率系スキル）
    mul_skills.push(Number(section.find(".adrenaline option:selected").val()))

    // 不屈（倍率系スキル）
    mul_skills.push(Number(section.find(".fortify option:selected").val()))

    // 演奏攻撃力UP
    mul_skills.push(
        Number(section.find(".hh_atk option:selected").val()))
    
    
    /** 砲術
     * ガンランス: 1.1, 1.2, 1.3
     * 徹甲榴弾: 1.15, 1.3, 1.4
     * チャージアックス: 1.3, 1.35, 1.4
     * 
     * ネコ砲術（火属性値をあげるのか不明）
     * ガンランス: 1.1
     * 徹甲榴弾: 1.15
     * チャージアックス: 1.15
     * チャージアックスの場合は砲術師+ネコ砲術で1.4が上限 */
    let artillery_txt = 
        section.find(".artillery option:selected").text()
    let artillery = 
        section.find(".artillery option:selected").val().split(",")
    let felyne_bomb_txt = 
        section.find(".felyne_bomb option:selected").text()
    let felyne_bomb = 
        section.find(".felyne_bomb option:selected").val().split(",")
    
    let artillery_magn = 1
    switch (weapon_type){
        case "ガンランス":
            // 砲撃術 * 猫砲撃 少数第2位以下を切り捨てる
            artillery_magn *= 
                truncate_decimal_place(
                    Number(artillery[0]) * Number(felyne_bomb[0]))
            break
        case "チャージアックス":
            // 砲撃術 * 猫砲術 上限1.4
            artillery_magn = Number(artillery[2]) * Number(felyne_bomb[1])
            if(artillery_magn > 1.4){artillery_magn = 1.4}
            break
        case "ライトボウガン":
        case "ヘヴィボウガン":
            artillery_magn *= Number(artillery[1]) * Number(felyne_bomb[1])
            break
    }


    /* 会心率UPスキル *******************************************************/
    // 達人
    affinity += Number(section.find(".expert option:selected").val())
    
    /** 力の解放
     *  +1: +30
     *  +2: +50*/
    affinity += Number(
        section.find(".latent_power option:selected").val())
    
    // 狂竜症克服
    affinity += Number(
        section.find(".antivirus option:selected").val())
    
    // 演奏会心UP
    affinity += 
        Number(section.find(".hh_affi option:selected").val())


    /* 属性スキル **********************************************************/
    // 表示属性値に乗算 倍率の上限は1.2
    // 単属性強化
    let ind_e_up = 
        section.find(".ind_ele_up option:selected").val().split(",")
    
    // 全属性強化
    let e_up = 
        Number(section.find(".ele_up option:selected").val())
    
    // 狩猟笛旋律 属性攻撃力強化
    let hh_e_up = 
        Number(section.find(".hh_ele option:selected").val())

    let element_up = Number(ind_e_up[0]) * e_up * hh_e_up
    // element_upが1.2を超えたら1.2にする
    if(element_up > 1.2){element_up = 1.2}
    ele_val = 
        truncate_ones_place(ele_val * element_up) + Number(ind_e_up[1])
    
    
    /** 会心撃【属性】*/
    let crit_ele_magn = 1
    if (section.find(".crit_element option:selected").val() == "1"){
        // 会心撃【属性】がありの場合
        switch (weapon_type){
            case "大剣":
                crit_ele_magn = 1.2
                break
            case "片手剣":
            case "双剣":
            case "弓":
                crit_ele_magn = 1.35
                break
            case "ライトボウガン":
            case "ヘヴィボウガン":
                crit_ele_magn = 1.3
                break
            default:
                crit_ele_magn = 1.25
                break
        }
    }
    

    /* 敵パラメータ補正スキル ************************************************/
    // 痛撃 （肉質へ加算）
    let weakness_exp = Number(
        section.find(".weakness_exploit option:selected").val())
    

    /* その他スキル *********************************************************/
    /** 未実装スキル
     *  抜刀会心
     *  抜刀減気
     *  薬・護符・爪
     */

    // 加算スキルを武器倍率に加算
    weapon_magn += sum_array(sum_skills)
    // 乗算スキルを武器倍率に乗算
    weapon_magn *= mul_array(mul_skills)
    // 属性倍率を計算
    let ele_magn = ele_val / 10
    // 会心期待値を計算
    let affi_exp = calc_affi_exp(affinity)
    // 属性会心期待値の計算
    let crit_ele_exp = calc_affi_exp(affinity, crit_ele_magn)
    
    // モンスター名を取得
    let monster = section.find(".monster select option:selected").text()

    // damage_dict = {モーション名: [物理ダメージ, 属性ダメージ, etc...]}
    let damage_dict = {}
    let result_table = $(this).parents().find(".result")

    // jsonを呼び出し
    $.ajax({
        url: "monster_data.json",
        type: "get",
        dataType: "json"
    }).then(function(data){
        // 武器種別に計算をする
        switch(weapon_type){
            case "大剣": {
                // 中腹ヒット倍率を取得
                let center_of_blade = Number(
                    section.find(".center_of_blade select option:selected").val())
                for(motion in GS_DICT){
                    // モーションのダメージタイプを取得
                    let dmg_type = GS_DICT[motion]["dmg_type"]
                    // モーション値
                        motion_val = GS_DICT[motion]["motion_val"],
                    // モーション毎の斬れ味補正
                        sharp_up = GS_DICT[motion]["sharp_up"],
                    // モーション毎の属性補正
                        ele_up = GS_DICT[motion]["ele_up"],
                        part_dmg_dict = {} // 部位毎のダメージを格納するdict
                    
                    for(part in data[monster]){
                        // モンスターの部位毎のダメージタイプ肉質を取得
                        let weak = data[monster][part][dmg_type],
                        // 肉質ごとのダメージを格納する配列
                            dmg_arr = [{}, {}]
                        
                        // 肉質変化しない場合、怒り肉質を通常肉質と同じ値にする
                        if(weak.length == 1){ weak.push(weak[0]) }
                        
                        // 物理ダメージを計算
                        // 肉質変化があればそれぞれ計算
                        for(let i = 0; i < weak.length; i++){
                            dmg_arr[i]["物理"] = mul(weapon_magn,
                                motion_val / 100, affi_exp, phys_sharp_magn, sharp_up, 
                                center_of_blade, weak[i] / 100)
                        }

                        // 属性ダメージの計算 無属性なら計算しない
                        if(ele_type == "" || ele_type == "無"){
                            // 何もしない
                        }else{
                            // モンスターの部位毎の耐属性を取得
                            weak = data[monster][part][ele_type]

                            // 耐属性変化しない場合、怒りを通常と同じ値にする
                            if(weak.length == 1){ weak.push(weak[0]) }
                            
                            // 耐属性変化があればそれぞれを計算
                            for(let i = 0; i < weak.length; i++){
                                dmg_arr[i]["属性"] = 
                                    mul(ele_magn, ele_up,   
                                        ele_sharp_magn, weak[i] / 100,
                                        crit_ele_exp)
                            }
                        }
                        part_dmg_dict[part] = dmg_arr
                    }
                    damage_dict[motion] = part_dmg_dict
                }
                break
            }
            case "太刀": {
                
                /** 中腹ヒット: 斬れ味に乗算
                 *  錬気ゲージフル: 斬れ味に乗算
                 *  錬気ゲージ色: モーションに乗算（端数切捨）
                 *  白: *1.05
                 *  黄: *1.1
                 *  赤: *1.3 */
                let center_of_blade = Number(section
                    .find(".center_of_blade select option:selected")
                        .val()),
                    spirit_full = Number(section
                    .find(".spirit_full select option:selected")
                        .val()),
                    spirit_color = Number(section
                    .find(".spirit_color select option:selected")
                        .val())
                
                // モーションごとにダメージを計算
                for(m in LS_DICT){
                    // モーションのダメージタイプを取得
                    let dmg_type = LS_DICT[m]["dmg_type"],
                        motion_val = LS_DICT[m]["motion_val"],
                    // 部位毎のダメージを格納する連想配列
                        part_dmg_dict = {}

                    for(part in data[monster]){
                        // モンスターの部位毎のダメージタイプ肉質を取得
                        let weak = data[monster][part][dmg_type],
                        // 肉質ごとのダメージを格納する配列
                            dmg_arr = [{}, {}]
                        
                        // 肉質変化しない場合、怒り肉質を通常肉質と同じ値にする
                        if(weak.length == 1){ weak.push(weak[0]) }
                        
                        // 物理ダメージを計算
                        // 肉質変化があればそれぞれ計算
                        for(let i = 0; i < weak.length; i++){
                            // モーション配列からモーション値を取り出し計算
                            // 結果を合計
                            let sum_motion_dmg = 0
                            for(let n = 0; n < motion_val.length; n++){
                                // 錬気ゲージ色をモーション値に乗算し、端数切り捨て
                                let mv = Math.floor(
                                    motion_val[n] * spirit_color)
                                sum_motion_dmg += mul(weapon_magn,
                                    mv / 100, affi_exp, phys_sharp_magn,spirit_full, center_of_blade, 
                                    weak[i] / 100)
                            }
                            dmg_arr[i]["物理"] = sum_motion_dmg
                        }

                        // 属性ダメージの計算 無属性なら計算しない
                        if(ele_type == "" || ele_type == "無"){
                            // 何もしない
                        }else{
                            // モンスターの部位毎の耐属性を取得
                            weak = data[monster][part][ele_type]

                            // 耐属性変化しない場合、怒りを通常と同じ値にする
                            if(weak.length == 1){ weak.push(weak[0]) }
                            
                            // 耐属性変化があればそれぞれを計算
                            for(let i = 0; i < weak.length; i++){
                                dmg_arr[i]["属性"] = 
                                    mul(ele_magn, ele_sharp_magn,
                                        weak[i] / 100, crit_ele_exp) 
                                    * motion_val.length
                            }
                        }
                        part_dmg_dict[part] = dmg_arr
                    }
                    damage_dict[m] = part_dmg_dict
                }
                break
            }
            case "片手剣": {
                /** 斬撃タイプの攻撃は、斬れ味補正 *1.06
                 *  溜め斬りは、属性補正 *2 */ 

                for(motion in SnS_DICT){
                    // モーションのダメージタイプを取得
                    let dmg_type = SnS_DICT[motion]["dmg_type"],
                    // モーション値
                        motion_val = SnS_DICT[motion]["motion_val"],
                    // 部位毎のダメージを格納するdict    
                        part_dmg_dict = {}, 
                    // 片手剣独自の補正用の変数
                        sharp_up = 1,
                        element_up = 1
                    // 斬撃タイプのモーションなら、物理斬れ味 *1.06
                    if(dmg_type == "切断"){
                        sharp_up = 1.06
                    }
                    // 溜め斬りは属性値 * 2 #未確定だけど盾と剣の両方を*2にした
                    if(motion.match(/溜め斬り/)){
                        element_up = 2
                    }

                    for(part in data[monster]){
                        // モンスターの部位毎のダメージタイプ肉質を取得
                        let weak = data[monster][part][dmg_type],
                        // 肉質ごとのダメージを格納する配列
                            dmg_arr = [{}, {}]
                        
                        // 肉質変化しない場合、怒り肉質を通常肉質と同じ値にする
                        if(weak.length == 1){ weak.push(weak[0]) }
                        
                        // 物理ダメージを計算
                        // 肉質変化があればそれぞれ計算
                        for(let i = 0; i < weak.length; i++){
                            dmg_arr[i]["物理"] = mul(weapon_magn,
                                motion_val / 100, affi_exp,
                                phys_sharp_magn, sharp_up, weak[i] / 100)
                        }

                        // 属性ダメージの計算 無属性なら計算しない
                        if(ele_type == "" || ele_type == "無"){
                            // 何もしない
                        }else{
                            // モンスターの部位毎の耐属性を取得
                            weak = data[monster][part][ele_type]

                            // 耐属性変化しない場合、怒りを通常と同じ値にする
                            if(weak.length == 1){ weak.push(weak[0]) }
                            
                            // 耐属性変化があればそれぞれを計算
                            for(let i = 0; i < weak.length; i++){
                                dmg_arr[i]["属性"] = 
                                    mul(ele_magn, element_up, 
                                        ele_sharp_magn, weak[i] / 100, crit_ele_exp)
                            }
                        }
                        part_dmg_dict[part] = dmg_arr
                    }
                    damage_dict[motion] = part_dmg_dict
                }
                break
            }
            case "双剣": {
                // 鬼人化時(非鬼人強化): モーション値*1.15（端数切捨て）
                // 両手攻撃: 属性値*0.7
                // 鬼人化状態なら1.15違うなら1
                let demon = section
                    .find(".demon_mode select option:selected").val()
                    // 属性ダメージ計算をするかどうかのフラグ
                    ele_flag = false
                if(!(ele_type == "" || ele_type == "無")){
                    // 武器が属性を持っていればフラグをtrue
                    ele_flag = true
                }
                // モーションごとにダメージを計算
                for(m in DB_DICT){
                    // モーションのダメージタイプを取得
                    let dmg_type = DB_DICT[m]["dmg_type"],
                        motion_arr = DB_DICT[m]["motion_arr"],
                        // 鬼人化フラグ
                        demon_flag = DB_DICT[m]["demon_flag"],
                    // 部位毎のダメージを格納する連想配列
                        part_dmg_dict = {}

                    for(part in data[monster]){
                        // モンスターの部位毎のダメージタイプ肉質を取得
                        let phys_weak = data[monster][part][dmg_type]
                        // 肉質変化しない場合、怒り肉質を通常肉質と同じ値にする
                        if(phys_weak.length == 1){ 
                            phys_weak.push(phys_weak[0]) 
                        }
                        // 属性付きの武器なら耐属性を取得
                        let ele_weak = []
                        if(ele_flag){
                            ele_weak = data[monster][part][ele_type]
                            if(ele_weak.length == 1){
                                ele_weak.push(ele_weak[0])
                            }
                        }    
                        // 肉質ごとのダメージを格納する配列
                        let dmg_arr = [{}, {}]
                        
                        // 物理ダメージを計算
                        // 肉質変化があればそれぞれ計算
                        for(let w = 0; w < phys_weak.length; w++){
                            // モーション配列からモーションdictを取り出し計算
                            // 物理ダメージを合計する変数
                            let sum_motion_dmg = 0
                            let sum_element_dmg = 0
                            for(let i = 0; i < motion_arr.length; i++){
                                // 鬼人化フラグが1か2のモーションなら、
                                // 切捨(モーション値*1.15)
                                let mv = motion_arr[i]["val"]
                                if (demon_flag == 1 || demon_flag == 2){
                                    mv = Math.floor(mv * demon)
                                }
                                // 物理ダメージ ヒット数を後からかける
                                sum_motion_dmg += 
                                    mul(weapon_magn, mv / 100, 
                                        affi_exp, phys_sharp_magn, 
                                        phys_weak[w] / 100, 
                                        motion_arr[i]["hits"])
                                // 属性ダメージ
                                if(ele_flag){
                                    sum_element_dmg += 
                                        mul(ele_magn, ele_sharp_magn,
                                            ele_weak[w] / 100, crit_ele_exp,
                                            motion_arr[i]["duals"],
                                            motion_arr[i]["hits"]) 
                                }
                            }
                            dmg_arr[w]["物理"] = sum_motion_dmg
                            dmg_arr[w]["属性"] = sum_element_dmg
                        }
                        part_dmg_dict[part] = dmg_arr
                    }
                    damage_dict[m] = part_dmg_dict
                }
                break
            }
            case "ハンマー":
                for(m in HAMMER_DICT){
                    if(m == "回転攻撃"){
                        // モーション値を取得
                        let mv = HAMMER_DICT[m][0][0]
                        for(let i = 1; i < HAMMER_DICT[m][1]+1; i++){
                            // 回転攻撃は1回転~6回転目まで１個ずつ計算
                            damage_dict[m+i] = []
                            // 物理ダメ
                            damage_dict[m+i].push(
                                mul(weapon_magn, mv / 100, affi_exp, 
                                    phys_sharp_magn, phys_weak))
                            // 属性ダメ
                            damage_dict[m+i].push(
                                mul(ele_magn, ele_sharp_magn, i,
                                    ele_weak, crit_ele_exp))
                            mv += HAMMER_DICT[m][0][1]
                            
                        }
                    }else{
                        damage_dict[m] = []
                        // 物理ダメ
                        damage_dict[m].push(
                            mul(weapon_magn, HAMMER_DICT[m][0]/100, affi_exp, 
                                phys_sharp_magn, phys_weak))
                        // 属性ダメ
                        damage_dict[m].push(
                            mul(ele_magn, ele_sharp_magn, HAMMER_DICT[m][1],
                                ele_weak, crit_ele_exp))
                    }
                }
                break
            case "狩猟笛":
                for(m in HH_DICT){
                    damage_dict[m] = []
                    // 物理ダメ
                    damage_dict[m].push(
                        mul(weapon_magn, HH_DICT[m]/100, affi_exp, phys_sharp_magn, phys_weak))
                    
                    // 属性ダメ
                    damage_dict[m].push(
                        mul(ele_magn, ele_sharp_magn, ele_weak, crit_ele_exp))
                }
                break
            case "ランス": {
                const IMPACT_CORRECTION = 0.72
                for(motion in LANCE_DICT){
                    // モーションのダメージタイプを取得
                    let dmg_type = LANCE_DICT[motion]["dmg_type"]
                    // モーション値
                        motion_val = LANCE_DICT[motion]["motion_val"],
                        part_dmg_dict = {} // 部位毎のダメージを格納するdict
                        // 属性ダメージ計算をするかどうかのフラグ
                        ele_flag = false
                    if(!(ele_type == "" || ele_type == "無")){
                        // 武器が属性を持っていればフラグをtrue
                        ele_flag = true
                    }

                    for(part in data[monster]){
                        let phys_weak = [],
                            ele_weak = [],
                            dmg_arr = [{}, {}]
                        if(dmg_type == "突き"){
                            // ダメージタイプが"突き"の時は、通常と怒り状態それぞれの打撃*0.72と切断のうち高い方をとりphys_weakに格納
                            let cut_weak = data[monster][part]["切断"]
                            let impact_weak = data[monster][part]["打撃"]
                            // 各肉質の要素数を揃える
                            if(cut_weak.length == 1){ 
                                cut_weak.push(cut_weak[0]) 
                            }
                            if(impact_weak.length == 1){ 
                                impact_weak.push(impact_weak[0])
                            }
                            for(let i = 0; i < 2; i++){
                                let imp = impact_weak[i] *      
                                    IMPACT_CORRECTION
                                if(cut_weak[i] > imp){
                                    // 切断肉質の方が大きければ切断肉質を格納
                                    phys_weak.push(cut_weak[i])
                                }else{
                                    phys_weak.push(imp)
                                }
                            }
                        }else{
                            // モンスターの部位毎のダメージタイプ肉質を取得
                            phys_weak = data[monster][part][dmg_type]
                            // 肉質変化しない場合、怒り肉質を通常肉質と同じ値にする
                            if(phys_weak.length == 1){ 
                                phys_weak.push(phys_weak[0])
                            }
                        }
                        // 属性付きの武器なら耐属性を取得
                        if(ele_flag){
                            ele_weak = data[monster][part][ele_type]
                            if(ele_weak.length == 1){
                                ele_weak.push(ele_weak[0])
                            }
                        }

                        // 肉質変化毎に物理・属性ダメージを計算
                        for(let i = 0; i < phys_weak.length; i++){
                            dmg_arr[i]["物理"] = mul(weapon_magn,
                                motion_val / 100, affi_exp, phys_sharp_magn, phys_weak[i] / 100)
                            dmg_arr[i]["属性"] = 
                                mul(ele_magn, ele_sharp_magn, 
                                    ele_weak[i] / 100, crit_ele_exp)
                        }
                        part_dmg_dict[part] = dmg_arr
                    }
                    damage_dict[motion] = part_dmg_dict
                }
                break
            }    
            case "ガンランス": {
                // 砲撃タイプを取得
                const SHELL_TYPE = section
                    .find(".shell_types select option:selected").val(),
                // 砲撃レベルを取得
                    LV = Number(section
                    .find(".shelling_lv select option:selected").val())
                let basic_shell_atk = GL_SHELL_TYPES[SHELL_TYPE][LV][0],
                    fire_atk = GL_SHELL_TYPES[SHELL_TYPE][LV][1]
                // 砲撃タイプ毎に各砲撃の倍率を設定
                // charged shelling, full burst, wyvern"s fire
                let cs, fb, wf
                switch(SHELL_TYPE){
                    case "通常": {
                        cs = 1.2
                        fb = 1.1
                        wf = 1
                        break
                    }
                    case "放射": {
                        cs = 1.2
                        fb = 1
                        wf = 1.2
                        break
                    }
                    case "拡散": {
                        cs = 1.44
                        fb = 0.9
                        wf = 1
                        break
                    }
                }

                /** 砲撃ダメージの計算 
                 *  切捨(切捨(切捨(砲撃の基本ダメ * 砲撃術) * 猫の砲撃術) * 砲撃タイプ倍率) + 砲撃の火ダメ
                 *  （未確定）砲撃の火ダメージ: 砲撃基本火ダメ * (未対応)耐火属性
                 *  各乗算で端数切り捨て */
                for(m in GL_DICT){
                    if(m == "砲撃" || m == "溜め砲撃"
                    || m == "フルバースト" || m == "竜撃砲"){
                        let shell_magn = 1
                        // 砲撃モーションごとの倍率
                        if(m == "溜め砲撃"){
                            shell_magn = cs
                        }else if(m == "フルバースト"){
                            shell_magn = fb
                        }else if(m == "竜撃砲"){
                            basic_shell_atk = 
                                GL_SHELL_TYPES["竜撃砲"][LV][0]
                            fire_atk = GL_SHELL_TYPES["竜撃砲"][LV][1]
                            shell_magn = wf
                        }
                        let part_dmg_dict = {}
                        for(p in data[monster]){
                            let dmg_arr = [{}, {}],
                                fire_weak = data[monster][p]["火"]
                            if(fire_weak.length == 1){
                                fire_weak.push(fire_weak[0])
                            }
                            for(let i = 0; i < 2; i++){
                                dmg_arr[i]["砲撃"] = Math.floor(
                                    Math.floor(Math.floor(
                                        basic_shell_atk * 
                                        artillery_magn)
                                        * shell_magn)
                                    + (fire_atk * fire_weak[i] / 100))
                                    * GL_DICT[m]["hits"]
                            }
                            part_dmg_dict[p] = dmg_arr
                        }
                        damage_dict[m] = part_dmg_dict
                    }else{
                        /** 通常のモーションのダメージ計算 */
                        // モーションのダメージタイプを取得
                        const DMG_TYPE = 
                            GL_DICT[m]["dmg_type"],
                        // モーション値
                            MOTION_VAL = GL_DICT[m]["motion_val"]
                                
                        // 部位毎のダメージを格納するdict
                        let part_dmg_dict = {},
                            ele_flag = false
                        if(!(ele_type == "" || ele_type == "無")){
                            ele_flag = true
                        }
                        
                        for(part in data[monster]){
                            // モンスターの部位毎のダメージタイプ肉質を取得
                            let phys_weak = 
                                data[monster][part][DMG_TYPE],
                                ele_weak = [],
                            // 肉質ごとのダメージを格納する配列
                                dmg_arr = [{}, {}]
                            // 肉質変化しない場合、怒り肉質を通常肉質と同じ値にする
                            if(phys_weak.length == 1){ 
                                phys_weak.push(phys_weak[0]) 
                            }
                            // 属性ダメージの計算 無属性なら計算しない
                            if(ele_flag){
                                // モンスターの部位毎の耐属性を取得
                                ele_weak = data[monster][part][ele_type]
                                // 耐属性変化しない場合、怒りを通常と同じ値にする
                                if(ele_weak.length == 1){           
                                    ele_weak.push(ele_weak[0]) 
                                }
                            }
                            
                            // 物理ダメージを計算
                            // 肉質変化があればそれぞれ計算
                            for(let i = 0; i < phys_weak.length;
                                i++){
                                dmg_arr[i]["物理"] = 
                                    mul(weapon_magn, MOTION_VAL / 100,
                                        affi_exp, phys_sharp_magn,
                                        phys_weak[i] / 100)
                                if(ele_flag){
                                    dmg_arr[i]["属性"] = 
                                        mul(ele_magn, ele_sharp_magn,
                                        ele_weak[i] / 100, crit_ele_exp)
                                }
                            }
                            part_dmg_dict[part] = dmg_arr
                        }
                        damage_dict[m] = part_dmg_dict
                    }
                }
                break
            }
            case "スラッシュアックス": {
                /** スラッシュアックスのダメージ計算
                 *  強撃(power)ビン: 端数切捨(モーション値*1.2)
                 *  強属性(element)ビン: 一の位切捨(表示属性値*1.25)
                 *  強撃と強属性ビン以外は未対応 */
                // ビンタイプを取得
                let phial_type = 
                    section.find(".sa_p_types select option:selected")      .text()
                for(m in SA_DICT){
                    // モーションのダメージタイプを取得
                    let dmg_type = SA_DICT[m]["dmg_type"],
                        motion_val = SA_DICT[m]["motion_val"],
                        // 部位毎のダメージを格納する連想配列
                        part_dmg_dict = {}
                        // 剣モードかどうかのフラグ
                        sword_mode = m.match(/剣:/)
                        element = ele_magn
                    // 強属性ビンかつ剣モーション
                    if(phial_type == "強属性" && sword_mode){
                        element = Math.floor(ele_magn * 1.25)
                    }

                    for(part in data[monster]){
                        // モンスターの部位毎のダメージタイプ肉質を取得
                        let weak = data[monster][part][dmg_type],
                        // 肉質ごとのダメージを格納する配列
                            dmg_arr = [{}, {}]
                        
                        // 肉質変化しない場合、怒り肉質を通常肉質と同じ値にする
                        if(weak.length == 1){ weak.push(weak[0]) }
                        
                        // 物理ダメージを計算
                        // 肉質変化があればそれぞれ計算
                        for(let i = 0; i < weak.length; i++){
                            let sum_motion_dmg = 0
                            // モーション値配列からモーション値を取り出し計算
                            for(let n = 0; n < motion_val.length; n++){
                                let mv = motion_val[n]
                                // 強撃ビンかつ剣モーションなら
                                // 切捨(モーション値*1.2)
                                if(phial_type == "強撃" && sword_mode){
                                    mv = Math.floor(motion_val[n] * 1.2)
                                }
                                sum_motion_dmg += mul(weapon_magn,
                                    mv / 100, affi_exp, phys_sharp_magn,
                                    weak[i] / 100)
                            }
                            dmg_arr[i]["物理"] = sum_motion_dmg
                        }

                        // 属性ダメージの計算 無属性なら計算しない
                        if(ele_type == "" || ele_type == "無"){
                            // 何もしない
                        }else{
                            // モンスターの部位毎の耐属性を取得
                            weak = data[monster][part][ele_type]
                            
                            // 耐属性変化しない場合、怒りを通常と同じ値にする
                            if(weak.length == 1){ weak.push(weak[0]) }
                            
                            // 耐属性変化があればそれぞれを計算
                            for(let i = 0; i < weak.length; i++){
                                dmg_arr[i]["属性"] = 
                                    mul(element, ele_sharp_magn,
                                        weak[i] / 100, crit_ele_exp) 
                                    * motion_val.length
                            }
                        }
                        part_dmg_dict[part] = dmg_arr
                    }
                    damage_dict[m] = part_dmg_dict
                }
                break
            }
            case "チャージアックス":
                /** ビン爆発ダメージ計算
                 *  榴弾: 武器倍率 * 榴弾係数 * 爆発回数 (* 属性強化倍率)
                 *  強属性: 属性倍率 * 強属性係数 * 爆発回数 (* 属性強化倍率)
                 *  damage_dict 
                 * {モーション名: {部位1:[[通常物理ダメ,怒り物理ダメ], 属性ダメ, ビンダメ], 怒り[...],
                 *               部位2:[...]}}*/
                // ビンタイプを取得
                let phials_type = 
                    section.find(".p_type select option:selected").val()
                // 属性強化倍率を取得
                let boost = Number(section
                    .find(".boost_mode select option:selected").val())
                
                for(m in CB_DICT){
                    // ダメージタイプを取得
                    let dmg_type = CB_DICT[m]["dmg_type"],
                        // モーション値配列をコピー
                        motion_val = CB_DICT[m]["motion_val"],
                        part_dmg_dict = {} // 部位毎のダメージを格納するdict
                    
                    // ビン爆発計算に使う変数を定義
                    let basic_phial_atk, phial_coef,
                        num_of_impacts = CB_DICT[m]["num_of_impacts"]
                    if (phials_type == "榴弾"){
                        basic_phial_atk = weapon_magn
                        phial_coef = CB_DICT[m]["impact_phial_coef"]
                    }else{ 
                        basic_phial_atk = ele_magn
                        phial_coef = CB_DICT[m]["ele_phial_coef"]
                    }
                    
                    // 属性強化ビン爆発補正をかける
                    if (boost == 1.2){
                        // 超高出力を除く解放斬り
                        if (m.match(/解放斬り/) && !m.match(/超高出力/)){
                            if(phials_type == "榴弾"){
                                basic_phial_atk *= 1.3
                            }else{
                                basic_phial_atk *= 1.35
                            }
                        }
                    }else{ // 通常状態
                        // 盾突き・チャージ斬り返し・カウンター爆発のビン爆発係数を0にする
                        if(m.match(/盾突き/)
                        || m.match(/チャージ斬り返し/)
                        || m.match(/GP爆発/)){
                            phial_coef = 0
                        }
                        // 通常状態なら超高出力は計算自体を飛ばす
                        if(m.match(/超高出力/)){ continue }
                    }

                    // 属性強化倍率をモーションに掛ける
                    for (let i = 0; i < motion_val.length; i++){
                        // 超高出力以外の斧と盾突きモーション値にboostをかける
                        if(m.match(/斧:/) && !m.match(/超高出力/)
                        || m.match(/盾突き/)){
                            motion_val[i] = 
                                Math.floor(motion_val[i] * boost)
                        }
                    }

                    for(part in data[monster]){
                        // ダメージタイプ肉質を取得
                        let weak = data[monster][part][dmg_type],
                            // 肉質ごとにダメージを格納
                            dmg_arr = [{}, {}]
                        
                        // 肉質変化しない場合、怒り肉質を通常肉質と同じ値にする
                        if(weak.length == 1){ weak.push(weak[0]) }

                        // 物理ダメージを計算
                        // 肉質変化があればそれぞれ計算
                        for(let i = 0; i < weak.length; i++){
                            // 複数ヒットモーションのそれぞれのダメージの合計
                            let sum_motion_dmg = 0 
                            for(let n = 0; n < motion_val.length;
                                n++){
                                // 物理ダメージ計算
                                sum_motion_dmg += mul(weapon_magn,
                                    motion_val[n] / 100, affi_exp, phys_sharp_magn, weak[i] / 100)
                            }
                            dmg_arr[i]["物理"] = sum_motion_dmg
        
                        }
                        
                        // 属性ダメージの計算 無属性なら計算しない
                        if(ele_type == "" || ele_type == "無"){
                            // 何もしない
                        }else{
                            // モンスターの部位毎の耐属性を取得
                            weak = data[monster][part][ele_type]
                            // 耐属性変化しない場合、怒りを通常と同じ値にする
                            if(weak.length == 1){ weak.push(weak[0]) }

                            // 耐属性変化があればそれぞれを計算
                            for(let i = 0; i < weak.length; i++){
                                dmg_arr[i]["属性"] = 
                                    mul(ele_magn, ele_sharp_magn,
                                        motion_val.length,
                                        weak[i] / 100,
                                        crit_ele_exp)
                                
                                // 強属性ビンダメージ計算
                                // 未確定だけど計算後に端数切り捨て
                                if(phials_type == "強属性"){
                                    dmg_arr[i]["ビン"] = Math.floor(
                                        mul(basic_phial_atk,
                                            phial_coef,
                                            weak[i] / 100))
                                        * num_of_impacts
                                }
                            }
                        }
                        // 部位毎の物理・属性ダメージを格納
                        part_dmg_dict[part] = dmg_arr
                    }
                    
                    // 榴弾は肉質に依存しないので、
                    // 計算回数を増やさないために後から追加
                    // 未確定だけど計算後に端数切り捨て
                    if(phials_type == "榴弾"){
                        for(p in part_dmg_dict){
                            let phial_dmg = Math.floor(mul(weapon_magn,
                                phial_coef, artillery_magn)) * num_of_impacts
                            for(let i = 0; i < part_dmg_dict[p].length; i++){
                                part_dmg_dict[p][i]["ビン"] = phial_dmg
                                //console.log(part_dmg_dict[p][i])
                            }
                        }
                    }
                    damage_dict[m] = part_dmg_dict
                }
                break
            
            case "操虫棍":
                // 赤白エキス モーション値*1.2 
                // 赤白橙エキス モーション値*1.25
                let essences = Number(section.find(".essences select option:selected").val())
                if(essences > 1){
                    // エキスが選択された時は赤エキス時に存在するモーションだけ計算
                    for(m in IG_DICT){
                        damage_dict[m] = []
                        if(IG_DICT[m][2]){
                            // 物理
                            damage_dict[m].push(
                                mul(weapon_magn, essences, sum_array(IG_DICT[m][0]) / 100, affi_exp, phys_sharp_magn, phys_weak))
                            // 属性
                            damage_dict[m].push(
                                mul(ele_magn, ele_sharp_magn, IG_DICT[m][1], ele_weak, crit_ele_magn))
                        }
                    }
                }else{
                    for(m in IG_DICT){
                        damage_dict[m] = []
                        // 物理
                        damage_dict[m].push(
                            mul(weapon_magn, sum_array(IG_DICT[m][0])/100, affi_exp,phys_sharp_magn, phys_weak))
                        // 属性
                        damage_dict[m].push(
                            mul(ele_magn, ele_sharp_magn, IG_DICT[m][1], ele_weak, crit_ele_magn))
                    }
                }
                break
        }
        // console.log(damage_dict)
        // 合計ダメージを計算して各ダメージ配列の最後に入れる
        for(m in damage_dict){
            for(p in damage_dict[m]){
                // 肉質変化のない部位ならそのdictを削除
                if(is_same_dict(damage_dict[m][p][0], damage_dict[m][p][1])){
                    damage_dict[m][p].pop()
                }
                // 合計を計算
                for(let w = 0; w < damage_dict[m][p].length; w++){
                    let sum = 0
                    for(k in damage_dict[m][p][w]){
                        sum += damage_dict[m][p][w][k]
                    }
                    // 肉質変化毎の合計ダメージ
                    damage_dict[m][p][w]["合計"] = Math.floor(sum)
                }
            }
        }
        console.log(damage_dict)
        // 計算結果の出力
        output_result_table(result_table, damage_dict)
    })
    
    return false
}




// Main
//ページが読み込まれたら動作
$(function(){
    var card_id = 1
        
    // 「カードを追加ボタン」が押されたら発動
    function click_add_card(){
        // .cardを追加する時
        // 呼んだカードのコピーを作成
        let card = $(this).parents(".card").clone()
        let section = $(this).prevAll(".input")
        // セレクトボックスの値だけcloneしたカードに設定
        card.find(".weapon_types select").val(
            section.children(".weapon_types select option:selected")
                .text())
        card.find(".sharpness").val(
            section.children(".sharpness")
            .find("option:selected").text())
        // 呼んだカードのidを記憶
        let called_id = card.attr("id")
        // 新しいカードにidをつける
        card.attr("id", card_id)
        // 追加されたカードは元カードの次に追加
        $("#" + called_id).after(card)
        
        // 新しいカードにイベントを設定
        $("#" + card_id + " .weapon_types select")
            .on("change", set_weapon_select)
        $("#" + card_id + " .weapon_name select")
            .on("change", input_weapon_data)
        $("#" + card_id + " .ele_type select")
            .on("change", select_ele_type)
        $("#" + card_id + " .sharp_plus select")
            .on("change", update_sharpness)
        $("#" + card_id + " .awaken select")
            .on("change", update_element)
        $("#" + card_id + " .skills select").on("change", select_skills)
        $("#" + card_id + " .monster select")
            .on("change", output_monster_data_table)
        $("#" + card_id + " .calc").on("click", click_calc_botton)   
        $("#" + card_id + " .add_card").on("click", click_add_card)
        // カードidを更新
        card_id++
        return false
    }


    // 最初のカードにイベントを設定
    $("#0 .weapon_types select").on("change", set_weapon_select)
    $("#0 .weapon_name select").on("change", input_weapon_data)
    $("#0 .ele_type select").on("change", select_ele_type)
    $("#0 .sharp_plus select").on("change", update_sharpness)
    $("#0 .awaken select").on("change", update_element)
    $("#0 .monster select").on("change", output_monster_data_table)
    $("#0 .calc").on("click", click_calc_botton)   
    $("#0 .add_card").on("click", click_add_card)
    $("#0 .skills select").on("change", select_skills)
    

    // モンスターセレクトにmonster_data.jsonから名前を入力
    monster_name_to_select()
})

