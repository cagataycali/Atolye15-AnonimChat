/**
 * Etiketler collection'u
 * @type {Mongo.Collection}
 */
Etiketler = new Mongo.Collection("Etiketler");

/**
 * Yazılar collection'u
 * @type {Mongo.Collection}
 */
Yazilar = new Mongo.Collection("Yazilar");

/**
 * Kullanıcı Etiketleri
 */
KullaniciEtiketleri = new Mongo.Collection("KullaniciEtiketleri");

/**
 * Kullanıcıların sohbetleri
 * @type {Mongo.Collection}
 */
KullaniciSohbetleri = new Mongo.Collection("KullaniciSohbetleri");

/**
 * Sohbet
 * @type {Mongo.Collection}
 */
Sohbet = new Mongo.Collection("Sohbet");

/**
 * Meteor user
 */
Meteor.users.helpers({

    user_name: function() {
        return this.username;
    },

    /**
     * One To Many
     * Kullanıcının yazıları
     * @returns {Cursor}
     */
    yazilar: function () {
        return Yazilar.find({kullaniciId:Meteor.userId()});
    },

    /**
     * Kullanıcı etiketleri
     * @returns {Cursor}
     */
    etiketler: function () {
        return KullaniciEtiketleri.find({kullaniciId:Meteor.userId()});
    },

    sohbetler: function () {
        return KullaniciSohbetleri.find({kullaniciId:Meteor.userId()});
    }

});


/**
 * Bir etiketin birden fazla yazısı olabilir kurgusunu hazırlayalım.
 * Collection helper kullanarak.
 */
Etiketler.helpers({

    /**
     * İlgili etiketin yazıları
     * One To Many
     * @returns {Cursor}
     */
    yazilar: function () {

        /**
         * Yorumları o zaman çekiyoruz.
         */
        return Yazilar.find({ etiketId:this._id});
    }
});

KullaniciEtiketleri.helpers({

    /**
     * Many to One
     * @returns {any}
     */
    kullanici: function () {
        return Meteor.users.findOne({_id:this.kullaniciId});
    }

});

KullaniciSohbetleri.helpers({

    /**
     * Many to One
     * @returns {any}
     */
    kullanici: function () {
        return Meteor.users.findOne({_id:this.kullaniciId});
    }

});

Yazilar.helpers({

    /**
     * Many To One
     * Etiketin yazısı
     */
    etiket: function () {
        return Etiketler.findOne({ _id:yaziId});
    },

    /**
     * Many to One
     * @returns {any}
     */
    kullanici: function () {
        return Meteor.users.findOne({_id:this.kullaniciId});
    }

});


/**
 * Sadece istemcide çalışacak kodlar
 */
if (Meteor.isClient)
{
    console.log("Merhaba client!");

    /**
     * Kullanıcıların kendi yazıları sunucudan publish ( paylaşılıyor ) bizde onu subscribe ( takip ) ediyoruz!
     * Bu sayede veritabanından veriler kullanıcı bazlı filtrelenerek geliyor.
     */
    Meteor.subscribe('yazilar');
    Meteor.subscribe('KullaniciEtiketleri');
    Meteor.subscribe('etiketler');


    /**
     * Kayıtları kullanıcı adı üzerinden almak için.
     */
    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });


    // Etiketler
    Template.etiketler.helpers({

        etiketler: function () {

            /**
             * Veritabanımdaki bütün etiketleri dökelim.
             */
            return Etiketler.find();
        }

    });

    UI.body.events({

        /**
         * Herhangibi bir input içerisine yazılan veriyi alıyoruz ve veritabanından sorgulamak üzere session değerine atıyoruz.
         * @param event
         */
        'keyup .etiket_icerik': function (event) {

            event.preventDefault();

            /**
             * String'i yakalayalım.
             */
            var string = event.currentTarget.value;

            /**
             * Etiket içeriğini girilen yazıdan alıyoruz.
             */
            Session.set("etiketIcerik", string);

            //console.log(array);

            /**
             * Kullanıcının etiket içeriğine array'i kaydedelim.
             */
            Meteor.call('kullaniciEtiketEkle',string);


        }
    });

    // Etiketler


    /**
     * Yazı ekleme
     */
    Template.yaziEkle.events({

        /**
         * Form submit edildiğinde!
         */
        'submit form': function () {

            /**
             * İşlemi durdur!
             */
            event.preventDefault();

            /**
             * Etiket id değerini yakaladık.
             * @type {*|string|string}
             */
            var etiketId = this._id;

            /**
             * Yazı içeriğini al
             * @type {string}
             */
            var yazi = event.target.yazi_icerik.value;

            Meteor.call('yaziEkle',yazi,etiketId);

            /**
             * Yazı içerik formunu boşalt!
             * @type {string}
             */
            event.target.yazi_icerik.value = "";
        }

    });

}

/**
 * Sadece sunucuda çalışcak kodlar
 */
if ( Meteor.isServer )
{
    console.log("Hey dude u are awesome!");

    /**
     * Meteor veritabanından verileri paylaşacak ve istemci bu verileri yakalayarak ekrana basacak.
     * Meteor.publish metodunu kullanarak işlerimizi halledeceğiz.
     * İlgili etiketlerin yazılarını getirelim.
     */
    Meteor.publish('etiketler', function () {


        return Etiketler.find();
    });

    Meteor.publish('yazilar', function () {

        return Yazilar.find();

    });

    /**
     * Herkes kendi etiketlerini görebilir.
     */
    Meteor.publish('KullaniciEtiketleri', function () {

        return KullaniciEtiketleri.find({kullaniciId: this.userId});

    });

    Meteor.methods({

        'yaziEkle': function (yazi,etiketId) {
            Yazilar.insert({
                icerik: yazi,
                etiketId: etiketId
            });

            console.log("Yazı eklendi!");

        },
        'kullaniciEtiketEkle': function (etiket) {

            /**
             * Kullanıcının önceki tüm etiketlerini kaldıralım.
             */
            KullaniciEtiketleri.remove({kullaniciId:this.userId});

            /**
             * En son hangi etiketi girdiyse bunu veritabanına yazalım.
             */
            KullaniciEtiketleri.insert({

                kullaniciId: Meteor.userId(),
                etiketler : etiket

            });
        }
    })
}