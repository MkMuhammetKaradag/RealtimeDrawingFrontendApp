/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Geri çağrı (Callback) fonksiyonlarının tip tanımı.
 * Herhangi sayıda argüman alabilir ve herhangi bir değer döndürebilir.
 */
type CalllbackType = (...args: any[]) => any;

/**
 * Tek bir olayı (Event) temsil eden sınıf.
 * Bu olay için kayıtlı olan dinleyicileri (callback'leri) yönetir.
 */
class DispatcherEvent {
  public eventName: string; // Olayın adı (örneğin: 'draw_end')
  public callbacks: CalllbackType[]; // Bu olayı dinleyen fonksiyonların listesi

  /**
   * Yapıcı metot.
   * @param eventName - Olayın adını ayarlar.
   */
  constructor(eventName: string) {
    this.eventName = eventName;
    this.callbacks = [];
  }

  /**
   * Yeni bir geri çağrı (dinleyici) fonksiyonunu olaya kaydeder.
   * @param callback - Kaydedilecek fonksiyon.
   */
  registerCallback(callback: CalllbackType) {
    this.callbacks.push(callback);
  }

  /**
   * Kayıtlı bir geri çağrı fonksiyonunun kaydını siler.
   * @param callback - Kaydı silinecek fonksiyon.
   */
  unregisterCallback(callback: CalllbackType) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1); // Diziden fonksiyonu kaldırır.
    }
  }

  /**
   * Kayıtlı tüm dinleyicileri tetikler ve isteğe bağlı veriyi onlara iletir.
   * @param data - Dinleyicilere aktarılacak veri.
   */
  fire(data?: any) {
    // Dinleyiciler listesinin kopyası oluşturulur (slice(0)),
    // bu sayede bir dinleyici tetiklenirken kendini unregister etse bile hata oluşmaz.
    const callbacks = this.callbacks.slice(0);
    callbacks.forEach((callback) => {
      callback(data);
    });
  }
}

/**
 * Merkezi Olay Dağıtıcısı (Event Dispatcher) sınıfı.
 * Uygulama genelinde olayları dinlemek ve tetiklemek için kullanılır.
 * Bu sınıf, tüm farklı olayları ve onlara bağlı dinleyicileri yönetir.
 */
class Dispatcher {
  // Kayıtlı olayları tutan ana obje. Anahtar: eventName, Değer: DispatcherEvent örneği.
  public events: { [props: string]: DispatcherEvent };

  public constructor() {
    this.events = {};
  }

  /**
   * Bir olayı tetikler ve kayıtlı tüm dinleyicilere veriyi iletir.
   * @param eventName - Tetiklenecek olayın adı.
   * @param data - Dinleyicilere iletilecek veri.
   */
  public dispatch(eventName: string, data?: any) {
    const event = this.events[eventName];
    if (event) {
      event.fire(data); // Olay varsa, fire metodunu çağırarak dinleyicileri tetikle.
    }
  }

  /**
   * Bir olayı dinlemeye başlar (Yeni bir callback kaydeder).
   * Olay daha önce kaydedilmemişse, yeni bir DispatcherEvent objesi oluşturur.
   * @param eventName - Dinlenecek olayın adı.
   * @param callback - Olay tetiklendiğinde çalışacak fonksiyon.
   */
  public on(eventName: string, callback: CalllbackType) {
    let event = this.events[eventName];
    if (!event) {
      // Olay mevcut değilse, oluştur ve events objesine kaydet.
      event = new DispatcherEvent(eventName);
      this.events[eventName] = event;
    }
    event.registerCallback(callback); // Callback'i olaya kaydet.
  }

  /**
   * Bir olay dinleyicisinin kaydını siler.
   * @param eventName - Kaydı silinecek olayın adı.
   * @param callback - Kaydı silinecek fonksiyon.
   */
  public off(eventName: string, callback: CalllbackType) {
    const event = this.events[eventName];
    // Olay mevcutsa VE callback bu olayın dinleyicileri arasındaysa:
    if (event && event.callbacks.indexOf(callback) > -1) {
      event.unregisterCallback(callback); // Callback'in kaydını sil.

      // Eğer bu olay için başka dinleyici kalmadıysa, olayın kendisini de events objesinden sil.
      if (event.callbacks.length === 0) {
        delete this.events[eventName];
      }
    }
  }
}

// Varsayılan dışa aktarma (export) olarak Dispatcher sınıfını sunar.
export default Dispatcher;
