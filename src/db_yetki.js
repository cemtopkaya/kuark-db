function DB_Yetki() {

    var result = {};

    /**
     * Veritabanında tüm yetkileri başlatmak için buradan çalıştıracağız.
     * @returns {*}
     */
    var f_db_yetki_tumunu_baslat = function () {
        var islemler = [
            1, // Görüntüleme
            2, // Ekleme
            3, // Düzenleme
            4  // Silme
        ];
        var arrYetkiler = [
            {Id: 1, Islemler: [1, 2, 3, 4], Adi: "Tahtanın Anahtar Kelimeleri", Aciklama: "..."},
            {Id: 2, Islemler: [1, 2, 3, 4], Adi: "Tahtanın Üyeleri", Aciklama: "..."},
            {Id: 3, Islemler: [1,    3   ], Adi: "Genel Ihale Kayıtları", Aciklama: "..."},
            {Id: 4, Islemler: [1, 2, 3, 4], Adi: "Özel Ihale Kayıtları", Aciklama: "..."},
        ];
        var arrPromiseYetkiler = arrYetkiler.map(function (_elm, _idx, _arr) {
            return result.dbQ.hset(result.kp.yetki.tablo, _elm.Id, JSON.stringify(_elm));
        });

        return result.dbQ.Q.all(arrPromiseYetkiler)
            .then(function (_aktifler) {
                l.info("Yetkiler girildi. Promise sonuçları: " + _aktifler)
            }).fail(function (_err) {
                l.e("Yetkiler girilirken FAIL oldu. Hata: "+_err);
            });
    };

    result = {
        f_db_yetki_tumunu_baslat: f_db_yetki_tumunu_baslat
    };

    return result;
}

module.exports = DB_Yetki();