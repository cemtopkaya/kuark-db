'use strict';

var extension = require('kuark-extensions'),
    l = extension.winstonConfig;

/**
 *
 * @returns {DBRol}
 * @constructor
 */
function DB_Rol() {
    /**
     *
     * @type {DBRol}
     */
    var result = {};

    //region ROL BÖLGELERİ
    /**
     * Rol ile ilişkili bölge ekleme
     * @param _rol_id
     * @param _bolge_id
     * @param _tahta_id
     * @returns {*}
     */
    var f_db_rol_bolgesi_ekle = function (_rol_id, _bolge_id, _tahta_id) {
        return result.dbQ.sadd(result.kp.rol.ssetBolgeleri(_rol_id), _bolge_id);
    };

    /**
     * Rol bölge ilişkisini kaldır
     * @param _rol_id
     * @param _bolge_id
     * @param _tahta_id
     * @returns {*}
     */
    var f_db_rol_bolgesi_sil = function (_rol_id, _bolge_id, _tahta_id) {
        return result.dbQ.srem(result.kp.rol.ssetBolgeleri(_rol_id), _bolge_id);
    };

    /**
     * Role bağlı bölgeleri getirir
     * @param _rol_id
     * @param _tahta_id
     * @returns {*}
     */
    var f_db_rol_bolgeleri_tumu = function (_rol_id, _tahta_id) {

        return result.dbQ.smembers(result.kp.rol.ssetBolgeleri(_rol_id))
            .then(function (_bolge_idler) {
                if (_bolge_idler && _bolge_idler.length > 0) {
                    var db_bolge = require("./db_bolge");
                    return db_bolge.f_db_bolge_id(_bolge_idler)
                } else {
                    return null;
                }
            });
    };

    //endregion

    //region ROLLER
    var f_db_rol_tumu = function (_tahta_id) {
        return result.dbQ.smembers(result.kp.tahta.ssetOzelTahtaRolleri(_tahta_id, true))
            .then(function (_rol_idler) {
                return f_db_rol_id(_rol_idler);
            });
    };
    //endregion

    //region ROL_İD
    var f_db_rol_id = function (_id) {
        return Array.isArray(_id)
            ? result.dbQ.hmget_json_parse(result.kp.rol.tablo, _id)
            : result.dbQ.hget_json_parse(result.kp.rol.tablo, _id);
    };

    //endregion

    //region ROL EKLE-GÜNCELLE-SİL
    /**
     * Bir veya daha fazla rolü ekleyerek, tahta ile ilişkilendirmemizi eklememizi sağlar
     * @param {Rol|Rol[]} _rol
     * @param {integer} _tahta_id
     * @returns {Promise}
     */
    var f_db_rol_ekle = function (_rol, _tahta_id) {

        if (Array.isArray(_rol) && _rol.length > 0) {
            return _rol.mapX(null, f_rol_ekle, _tahta_id).allX();
        }
        else {
            return f_rol_ekle(_rol, _tahta_id);
        }
    };

    /**
     * Rol objesini ROL tablosuna yeni bir ID ile ekler,
     * Yeni Rol.Id'yi tahta ile ilişkilendirir.
     * @param {Rol} _rol
     * @param {integer} _tahta_id
     * @returns {Promise}
     */
    var f_rol_ekle = function (_rol, _tahta_id) {

        return result.dbQ.incr(result.kp.rol.idx)
            .then(function (_id) {
                _rol.Id = _id;
                // 1. Rollere ekleyelim
                // 2. Tahtayla ilişkilendirelim
                return result.dbQ.Q.all([
                    result.dbQ.hset(result.kp.rol.tablo, _id, JSON.stringify(_rol)),// 1
                    result.dbQ.sadd(result.kp.tahta.ssetOzelTahtaRolleri(_tahta_id, true), _rol.Id) // 2
                ]).then(function () {
                    return f_db_rol_id(_rol.Id);
                });
            });
    };

    var f_db_rol_guncelle = function (_tahta_id, _rol, _kul_id) {
        return result.dbQ.hset(result.kp.rol.tablo, _rol.Id, JSON.stringify(_rol))
            .then(function () {
                return f_db_rol_id(_rol.Id);
            });
    };

    /**
     * Bu _kul_id kullanıcısından _tahta_id tahtasında _rol_id rolünü siler
     * @param {integer} _kul_id
     * @param {integer} _tahta_id
     * @param {integer} _rol_id
     * @returns {Promise}
     */
    var f_db_rol_sil_kullanici = function (_kul_id, _tahta_id, _rol_id) {
        if (_rol_id) {
            return result.dbQ.hget_json_parse(result.kp.tahta.hsUyeleri(_tahta_id), _kul_id)
                .then(function (_arrUyeRolId) {
                    // tek bir sayı ya da bir dizi gelebilir ve biz diziyle yola devam etmek için concat yapıyoruz
                    _arrUyeRolId = [].concat(_arrUyeRolId);
                    var idxOfRolId = _arrUyeRolId.indexOf(_rol_id);
                    l.info("idxOfRolId>" + idxOfRolId);

                    if (idxOfRolId == -1) {
                        return 0;
                    } else {
                        _arrUyeRolId.splice(idxOfRolId, 1);
                        return result.dbQ.hset(result.kp.tahta.hsUyeleri(_tahta_id), _kul_id, JSON.stringify(_arrUyeRolId));
                    }
                });
        } else {
            l.warning("Silinecek aktif bir rol bulunamadı");
        }
    };

    /**
     * Tahtadan rol_id yi çıkaracak
     * @param {integer} _tahta_id
     * @param {integer} _rol_id
     * @param {integer[]=} _arrKul_id
     * @returns {{state: (string|string), value: Object}[]}
     */
    var f_db_rol_sil_tahta = function (_tahta_id, _rol_id, _arrKul_id) {

        // 1. Tahtanın üye id lerini Array mi diye kontrol et
        // 2. üye id lerinden rolü çıkar
        // 3. tahta id den bu rolü sil
        if (_rol_id) {
            var arrPromises = Array.isArray(_arrKul_id) //1
                ? _arrKul_id.mapX(null, f_db_rol_sil_kullanici, _tahta_id, _rol_id) // 2
                : [];
            //3

            return arrPromises.concat(_arrKul_id).allX()
                .then(function () {
                    return [
                        result.dbQ.srem(result.kp.tahta.ssetOzelTahtaRolleri(_tahta_id, true), _rol_id),
                        result.dbQ.sadd(result.kp.tahta.ssetOzelTahtaRolleri(_tahta_id, false), _rol_id)
                    ].allX();
                });
        } else {
            console.error("Silinecek aktif bir rol bulunamadı");
            throw "Silinecek aktif bir rol bulunamadı";
        }
    };

    /**
     * Tüm rollerin silinmesi sağlanır.
     * @param {int} _tahta_id
     * @param {int} _kul_id
     * @returns {*}
     */
    var f_db_rol_sil_tumu = function (_tahta_id, _kul_id) {
        return result.dbQ.smembers(result.kp.tahta.ssetOzelTahtaRolleri(_tahta_id, true))
            .then(function (_rol_idler) {
                if (_rol_idler && _rol_idler.length > 0) {
                    return _rol_idler.map(function (_id) {
                        return f_db_rol_sil_tahta(_tahta_id, _id, _kul_id);
                    });
                }
            });
    };

    //endregion

    /**
     * @class DBRol
     */
    result = {
        f_db_rol_bolgesi_ekle: f_db_rol_bolgesi_ekle,
        f_db_rol_bolgesi_sil: f_db_rol_bolgesi_sil,
        f_db_rol_bolgeleri_tumu: f_db_rol_bolgeleri_tumu,
        f_db_rol_sil_tumu: f_db_rol_sil_tumu,
        f_db_rol_sil_tahta: f_db_rol_sil_tahta,
        f_db_rol_sil_kullanici: f_db_rol_sil_kullanici,
        f_db_rol_guncelle: f_db_rol_guncelle,
        f_db_rol_ekle: f_db_rol_ekle,
        f_db_rol_id: f_db_rol_id,
        f_db_rol_tumu: f_db_rol_tumu
    };

    return result;
}


/**
 *
 * @type {DBRol}
 */
var obj = DB_Rol();
obj.__proto__ = require('./db_log');

module.exports = obj;