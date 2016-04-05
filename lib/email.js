var email = require("emailjs"),
    Q = require("q");

function EMail(_user, _password, _host, _ssl) {

    var result = {};

    function f_send(_text, _from, _to, _cc, _bcc, _subject, _html) {
        _from = _from || result.user;

        var defer = Q.defer(),
            mesaj = f_mesaj(_text, _from, _to, _cc, _bcc, _subject, _html),
            server = f_server();

        server.send(mesaj, function (err, message) {
            if (err) {
                console.log('Mail gönderilemedi! Hata:' + JSON.stringify(err));
                defer.reject(err);
            } else {
                console.log('Mail GÖNDERİLDİ');
                defer.resolve(message);
            }
        });
        return defer.promise;
    };

    function f_mesaj(_text, _from, _to, _cc, _bcc, _subject, _html) {
        if (!_to) {
            console.log("to> boş olamaz.Gönderilecek kişiyi seçiniz.");
            throw ("Gönderilecek kişiyi seçiniz.")
        }
        var message = {
            from: _from,
            to: _to,
            cc: _cc,
            subject: _subject,
            bcc: _bcc
        };

        if (!_html) {
            message.text = _text;
        } else {
            var icerik = "<html>" + result.sabit_baslik + _text + result.sabit_bitis + result.sabit_not + "</html>";
            message.attachment =
                [
                    {data: icerik, alternative: true}
                ];
        }

        return message;
    }

    function f_server() {
        return email.server.connect({
            user: result.user,
            password: result.password,
            host: result.host,
            ssl: result.ssl
        });
    }

    result.user = _user || "noreply.turkey@fmc-ag.com";
    result.password = _password || "FRESE001";
    result.host = _host || "smtp.fresenius.de";
    result.ssl = _ssl || true;
    result.sabit_not = "<br/><br/><i>NOT: Bu e-posta, Fresenius Kuark Sistemi tarafından otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız!</i>";
    result.sabit_baslik = "Değerli Kullanıcılarımız,<br/><br/>";
    result.sabit_bitis = "<br/><br/>İyi çalışmalar dileriz.";
    result.f_send = f_send;

    return result;
}
module.exports = EMail;