"""
マイクラカップ プロジェクト「フィジカルAI」
フェーズ1：micro:bit側メインコード

概要:
  micro:bit(v2)がセンサー値を200ms間隔でUSBシリアル経由にPCへ送信し、
  PCから届いたコマンドに応じてLED表示を変える。
  将来的にはPC上のNode.jsブリッジがこのシリアル通信を中継し、
  Minecraft Educationとやり取りする（今回はmicro:bit側のみ実装）。

通信仕様:
  ボーレート: 115200
  送信フォーマット: "種別,値1,値2,...\n" のCSV風テキスト（改行区切り）
  受信フォーマット: "コマンド名" または "コマンド名:引数" のテキスト（改行区切り）
"""

from microbit import (
    display,
    button_a,
    button_b,
    accelerometer,
    uart,
    Image,
    sleep,
    running_time,
    temperature,
)

# ============================================================
# 定数
# ============================================================

# センサー値を送信する間隔（ミリ秒）
SEND_INTERVAL_MS = 200

# 受信バッファに溜まった文字を一時的に貯めておく変数
_recv_buffer = ""


# ============================================================
# センサー読み取り関数
# ============================================================

def read_tilt():
    """
    加速度センサーからX,Y,Zの値を取得する。
    戻り値: (x, y, z) のタプル（単位はミリG、micro:bit標準のget_x/y/z()の値）
    """
    x = accelerometer.get_x()
    y = accelerometer.get_y()
    z = accelerometer.get_z()
    return (x, y, z)


def read_light():
    """
    LEDマトリクスを明るさセンサーとして流用し、明るさの値を取得する。
    注意: 呼び出した瞬間だけLEDが一時的に消灯し、その後に元の表示へ戻る
    （micro:bit標準の仕様。ICON表示中に呼ぶと一瞬だけ画面がちらつく）。
    戻り値: 0(暗い)～255(明るい)の整数
    """
    return display.read_light_level()


def read_temperature():
    """
    micro:bit内蔵の温度センサーから温度を取得する。
    戻り値: 摂氏温度（整数）
    """
    return temperature()


# ============================================================
# シリアル送信関数（micro:bit → PC）
# ============================================================

def send_tilt():
    """
    加速度（傾き）の値を "TILT,x,y,z" の形式で送信する。
    """
    x, y, z = read_tilt()
    print("TILT,{},{},{}".format(x, y, z))


def send_light():
    """
    明るさセンサーの値を "LIGHT,value" の形式で送信する。
    """
    value = read_light()
    print("LIGHT,{}".format(value))


def send_temperature():
    """
    温度センサーの値を "TEMP,value" の形式で送信する。
    """
    value = read_temperature()
    print("TEMP,{}".format(value))


def send_button_event(button_name):
    """
    ボタンが押されたことを "BUTTON,A" または "BUTTON,B" の形式で送信する。
    引数:
      button_name: "A" または "B"
    """
    print("BUTTON,{}".format(button_name))


def send_all_sensors():
    """
    全センサーの値をまとめて送信する（200msごとに呼び出される想定）。
    """
    send_tilt()
    send_light()
    send_temperature()


def check_and_send_button_events():
    """
    ボタンA・ボタンBの押下を検知し、押されていればイベントを送信する。
    was_pressed()は「前回呼び出し以降に押されたか」を判定するので、
    押しっぱなしでも連続で大量送信されることはない。
    """
    if button_a.was_pressed():
        send_button_event("A")
    if button_b.was_pressed():
        send_button_event("B")


# ============================================================
# シリアル受信関数（PC → micro:bit）
# ============================================================

def apply_command(command):
    """
    受信した1行分のコマンド文字列を解釈し、LED表示に反映する。
    未知のコマンドはエラーを出さずに無視する（if/elifで一致しなければ何もしない）。
    引数:
      command: 受信した文字列（前後の空白・改行は除去済みであること）
    """
    if command == "LED:ON":
        # LEDマトリクスを全点灯する
        display.show(Image("99999:99999:99999:99999:99999"))
    elif command == "LED:OFF":
        # LEDマトリクスを全消灯する
        display.clear()
    elif command == "ICON:HAPPY":
        # 笑顔アイコンを表示する
        display.show(Image.HAPPY)
    elif command == "ICON:SAD":
        # 悲しい顔アイコンを表示する
        display.show(Image.SAD)
    else:
        # 未知のコマンドは無視する（例外を出さず処理を続ける）
        pass


def read_serial_commands():
    """
    シリアル受信バッファを読み取り、改行で区切られたコマンドを処理する。
    uart.read()は受信済みのバイト列を返す（何も無ければNoneを返す、非ブロッキング）。
    1回の読み取りで複数行・半端な行が混ざることがあるため、
    バッファに貯めておき「\n」が現れた分だけコマンドとして切り出す。
    """
    global _recv_buffer

    incoming = uart.read()
    if incoming is None:
        return

    try:
        text = incoming.decode("utf-8")
    except UnicodeError:
        # 文字化けなど不正なデータは無視する
        return

    _recv_buffer += text

    # 改行が来るたびに1コマンドとして処理する
    while "\n" in _recv_buffer:
        line, _recv_buffer = _recv_buffer.split("\n", 1)
        line = line.strip()
        if line:
            apply_command(line)


# ============================================================
# 初期化
# ============================================================

def setup():
    """
    起動時の初期化処理。
    uart.init()でボーレートを115200に設定する
    （tx/rxを指定しないのでUSBシリアル＝PythonエディタのREPLと同じ接続を使い続ける）。
    起動が完了したことをLEDのチェックマークで一瞬知らせる。
    """
    uart.init(baudrate=115200)
    display.show(Image.YES)
    sleep(300)
    display.clear()


# ============================================================
# メインループ
# ============================================================

def main():
    """
    メインループ。
    - 200ms間隔でセンサー値を送信する
    - 毎ループでボタン押下イベントとシリアル受信コマンドをチェックする
    - sleep(20)を挟んで軽くCPUを休ませつつ、体感的な遅延が出ない程度に保つ
    """
    setup()
    last_send_time = running_time()

    while True:
        # PCからのコマンド受信を毎回チェックする（応答性を優先）
        read_serial_commands()

        # ボタン押下イベントも毎回チェックする
        check_and_send_button_events()

        # 200ms経過していたらセンサー値をまとめて送信する
        now = running_time()
        if now - last_send_time >= SEND_INTERVAL_MS:
            send_all_sensors()
            last_send_time = now

        sleep(20)


main()
