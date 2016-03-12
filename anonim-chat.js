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

Yazilar.helpers({

    /**
     * Many To One
     * Etiketin yazısı
     */
    etiket: function () {
        return Etiketler.findOne({ _id:yaziId});
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
    Meteor.subscribe('etiketler');


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
             * Etiket içeriğini girilen yazıdan alıyoruz.
             */
            Session.set("etiketIcerik", event.currentTarget.value);
            //console.log(event.currentTarget.value);

            console.log(Session.get("etiketIcerik"));

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
             * Yazı içeriğini al
             * @type {string}
             */
            var yazi = event.target.yazi_icerik.value;

            Meteor.call('yaziEkle',yazi);

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

        var etiketIcerik =  Session.get('etiketIcerik');

        return Etiketler.find({"icerik":/etiketIcerik/});
    });

    Meteor.publish('yazilar', function () {

        return Yazilar.find();

    });

    /**
     * Meteor'un metods metodu,
     * Veritabanımıza gireceğimiz (insert) verilerin güvenlik dahilinde
     * İçeri aktarılması içindir!
     */
    Meteor.methods({

        /**
         * Yazı Ekleme Metodu
         * @param yazi
         */
        'yaziEkle': function (yazi) {
            Yazilar.insert({
                icerik : yazi,
                createdAt : new Date
            });

            console.log("Yazı eklendi dude !!");
        }
    })
}