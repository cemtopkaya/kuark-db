/**
 *
 * @returns {DBCopKutusu}
 * @constructor
 */
function DB_Cop_Kutusu() {
    var teklif = require('./db_teklif'),
        kalem = require('./db_kalem'),
        urun = require('./db_urun'),
        ihale = require('./db_ihale'),
        kurum = require('./db_kurum'),
        tahta = require('./db_tahta'),
        /**
         *
         * @type {DBCopKutusu}
         */
        result = {};

    /**
     * Tahta silme işleminde yapılacak adımlar
     * 1-Tahtaya ait sistemde kayıtlı ihale var mı? >> Varsa silemezsin
     * 2-Tahtaya ait sistemde kayıtlı teklif var mı? >> Varsa silemezsin
     * 3-Tahtayı sil
     * @param {integer} _tahta_id
     * @returns {*}
     */
    var f_db_cop_tahta_sil = function (_tahta_id, _kullanici_id, _q) {
        //tahtayı sil
        return tahta.f_db_tahta_sil(_tahta_id, _kullanici_id, _q);

    };

    /**
     * İhale silme işleminde yapılacak adımlar
     * 1-Kullanıcının yetkisi var mı >> yoksa işlem yapma
     * 2-Silinmek istenen ihale Genel kurum mu? >> evetse işlem yapma
     * 3-İhaleye ait sistemde kayıtlı teklif var mı? >> Varsa silemezsin
     * 4-İhaleyi sil
     * @param {integer} _tahta_id
     * @param {integer} _ihale_id
     * @returns {*}
     */
    var f_db_cop_ihale_sil = function (_tahta_id, _ihale_id, _kullanici_id) {
        return ihale.f_db_ihale_genel_kontrol(_ihale_id)
            .then(function (_iGenel) {
                if (_iGenel == 1) {
                    //bu ihale genelde silinemez!
                    throw new exception.istisna("İhale Silinemedi!",
                        "Silinmek istenen ihale GENEL ihaleler içerisinde kayıtlı olduğu için işlem tamamlanamadı!");

                } else {
                    return ihale.f_db_ihale_teklifleri(_tahta_id, _ihale_id)
                        .then(function (_teklifler) {
                            if (_teklifler != null && _teklifler.length > 0) {
                                throw new exception.istisna("İhale silinemez!",
                                    "Silinmek istenen ihaleye bağlı teklifler kayıtlı olduğu için işlem gerçekleştirilemez!");

                            } else {
                                //ihaleyi sil
                                return ihale.f_db_tahta_ihale_sil(_ihale_id, _tahta_id, _kullanici_id);
                            }
                        });
                }
            });
    };

    /**
     * Kalem silme işleminde yapılacak adımlar
     * 1-Kullanıcının yetkisi var mı >> yoksa işlem yapma
     * 2-Silinmek istenen kalem Genel kurum mu? >> evetse işlem yapma
     * 3-Kaleme ait sistemde kayıtlı teklif var mı? >> Varsa silemezsin
     * 4-Kalemi sil
     * @param {integer} _tahta_id
     * @param {integer} _ihale_id
     * @param {integer} _kalem_id
     * @returns {*}
     */
    var f_db_cop_kalem_sil = function (_tahta_id, _ihale_id, _kalem_id, _kullanici_id) {
        return kalem.f_db_kalem_genel_kontrol(_kalem_id)
            .then(function (_iGenel) {
                if (_iGenel == 1) {
                    throw new exception.istisna("Kalem silinemedi!", "Silinmek istenen kalem Genel kalem setinde olduğu için işlem gerçekleştirilemedi!");

                } else {
                    return kalem.f_db_kalem_teklif_kontrol(_tahta_id, _kalem_id)
                        .then(function (_teklifler) {
                            if (_teklifler && _teklifler != null && _teklifler.length > 0) {

                                throw new exception.istisna("Kalem silinemez!", "Kaleme bağlı sistemde kayıtlı teklifler olduğu için işlem gerçekleştirilemez!");

                            } else {

                                //kalemi sil
                                return kalem.f_db_kalem_sil_tahta(_kalem_id, _tahta_id, _ihale_id, _kullanici_id);
                            }
                        })
                }
            });
    };

    /**
     * Kurum silme işleminde yapılacak adımlar
     * 1-Kullanıcının yetkisi var mı >> yoksa işlem yapma
     * 2-Silinmek istenen kurum Genel kurum mu? >> evetse işlem yapma
     * 3-Kurumun teklifi var mı? >> Varsa silemezsin
     * 4-Kurumu sil
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @returns {*}
     */
    var f_db_cop_kurum_sil = function (_tahta_id, _kurum_id, _kullanici_id) {
        return kurum.f_db_kurum_genel_kontrol(_kurum_id)
            .then(function (_iGenel) {
                if (_iGenel == 1) {
                    throw new exception.istisna("Kurum Silinemedi!", "Silinmek istenen kurum GENEL kurumlar içerisinde kayıtlı olduğu için işlem tamamlanamadı!");
                } else {

                    return kurum.f_db_kurum_teklif_temp(_tahta_id, _kurum_id)
                        .then(function (_teklifler) {
                            if (_teklifler.length > 0) {

                                //teklif var silemezsin
                                throw new exception.istisna("Kurum Silinemedi!", "Silmek istediğiniz kuruma ait sistemde kayıtlı teklifler bulunduğu için işlem tamamlanamadı!");

                            } else {
                                return kurum.f_db_kurum_sil(_tahta_id, _kurum_id, _kullanici_id);
                            }
                        });
                }
            });
    };

    /**
     * Kurum silme işleminde yapılacak adımlar
     * 1-Kullanıcının yetkisi var mı >> yoksa işlem yapma
     * 3-Ürünün teklifi var mı? >> Varsa silemezsin
     * 4-Ürünü sil
     * @param {integer} _tahta_id
     * @param {integer} _urun_id
     * @returns {*}
     */
    var f_db_cop_urun_sil = function (_tahta_id, _urun_id, _kullanici_id) {
        return urun.f_db_urun_teklif_kontrol(_tahta_id, _urun_id)
            .then(function (_teklifler) {
                if (_teklifler && _teklifler != null && _teklifler.length > 0) {

                    throw new exception.istisna("Ürün silinemedi!",
                        "Silinmek istenen ürüne ait sistemde kayıtlı teklifler olduğu için işlem gerçekleştirilemez!");

                } else {
                    return urun.f_db_urun_sil(_tahta_id, _urun_id, _kullanici_id);
                }
            });
    };

    /**
     * Teklif silme işleminde yapılacak adımlar
     * 1-Kullanıcının yetkisi var mı >> yoksa işlem yapma
     * 2-Teklifi sil
     * @param {integer} _tahta_id
     * @param {integer} _teklif_id
     * @param {integer} _kullanici_id
     * @returns {Promise}
     */
    var f_db_cop_teklif_sil = function (_tahta_id, _teklif_id, _kullanici_id) {
        return teklif.f_db_teklif_sil(_teklif_id, _tahta_id, _kullanici_id);
    };

    /**
     * @class DBCopKutusu
     */
    result = {
        f_db_cop_tahta_sil: f_db_cop_tahta_sil,
        f_db_cop_ihale_sil: f_db_cop_ihale_sil,
        f_db_cop_kalem_sil: f_db_cop_kalem_sil,
        f_db_cop_kurum_sil: f_db_cop_kurum_sil,
        f_db_cop_urun_sil: f_db_cop_urun_sil,
        f_db_cop_teklif_sil: f_db_cop_teklif_sil
    };
    return result;
}

/**
 *
 * @type {DBCopKutusu}
 */
var obj = DB_Cop_Kutusu();
obj.__proto__ = require('./db_log');

module.exports = obj;