/**
 * Geri Al (Undo) ve Yinele (Redo) hareketlerini Canvas üzerinde uygulamak için
 * iki yığın (stack) kullanarak durumu yöneten sınıf.
 * Bu yapı, Command tasarım deseninin bir uygulamasıdır.
 */
class Snapshot {
  // imageData1: İlerleme yığını (Tarihçe). Mevcut durum ve geçmişteki adımlar burada tutulur.
  private imageData1: ImageData[] = [];
  // imageData2: Geri alma yığını (İptal edilenler). Geri alınan adımlar buraya taşınır.
  private imageData2: ImageData[] = [];

  /**
   * Yeni bir Canvas anlık görüntüsünü (durumunu) tarihçeye ekler.
   * Yeni bir durum eklendiğinde, Yinele (Redo) yığını (imageData2) temizlenmelidir,
   * ancak bu fonksiyonda temizlenmemiş. (Bu bir potansiyel geliştirme alanıdır.)
   * @param imageData - Canvas'ın mevcut durumunu temsil eden ImageData objesi.
   */
  public add(imageData: ImageData) {
    this.imageData1.push(imageData);
  }

  /**
   * Geçerli Canvas anlık görüntüsünü (en son kaydedilen durumu) döndürür.
   */
  public get current() {
    return this.imageData1[this.imageData1.length - 1];
  }

  /**
   * Geri Al (Undo) işlemini gerçekleştirir.
   * Tarihçe yığınından (imageData1) son durumu çıkarıp, İptal yığınına (imageData2) ekler.
   * @returns Geri alınmış durumdan sonraki yeni Canvas anlık görüntüsü veya hiçbiri kalmadıysa null.
   */
  public back() {
    // Tarihçede en az iki durum olmalı ki, bir adım geri alabilelim (En az bir durum kalmalı).
    if (this.imageData1.length > 1) {
      // 1. Son durumu tarihçe yığınından çıkar.
      const imageData = this.imageData1.pop() as ImageData;
      // 2. Çıkarılan durumu (iptal edilen adımı) Redo yığınına ekle.
      this.imageData2.push(imageData);
    }

    // Geri alma işleminden sonraki mevcut durumu döndürür.
    return this.imageData1.length > 0
      ? this.imageData1[this.imageData1.length - 1]
      : null;
  }

  /**
   * Yinele (Redo) işlemini gerçekleştirir.
   * İptal yığınından (imageData2) bir durumu çıkarıp, Tarihçe yığınına (imageData1) ekler.
   * @returns İleri alınmış durumdan sonraki yeni Canvas anlık görüntüsü veya hiçbiri yoksa null.
   */
  public forward() {
    // Yineleme yığınında durum olmalı.
    if (this.imageData2.length > 0) {
      // 1. Redo yığınından son durumu çıkar.
      const imageData = this.imageData2.pop() as ImageData;
      // 2. Çıkarılan durumu tekrar Tarihçe yığınına ekle.
      this.imageData1.push(imageData);
    }

    // İleri alma işleminden sonraki mevcut durumu döndürür.
    return this.imageData1.length > 0
      ? this.imageData1[this.imageData1.length - 1]
      : null;
  }

  /**
   * Geçerli Canvas anlık görüntüsünü (en son kaydedilen durumu) döndürür.
   * Bu getter zaten var, sadece ismi current.
   */
  public getLatestImageData() {
    return this.imageData1[this.imageData1.length - 1] || null;
  }
}

export default Snapshot;
