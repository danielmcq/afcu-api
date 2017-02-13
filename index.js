'use strict';

const Banking = require('banking');

const config = require('./config.json');

const bank = Banking(config['banking-client']);

let start = process.argv[2];
let end = process.argv[3];

bank.getStatement({start, end}, (err, res) => {
    if(err) return console.log(err);

    console.log(JSON.stringify(transform(res.body), null, 4));
});

function transform (body) {
    let out = body;

    if (body.OFX && body.OFX.BANKMSGSRSV1 && body.OFX.BANKMSGSRSV1.STMTTRNRS && body.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS && body.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST && body.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN) {
        let transactions = body.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;

        transactions.map(transaction => {
            delete transaction.NAME;

            transaction.postedAt = parseOfxDate(transaction.DTPOSTED);
            delete transaction.DTPOSTED;

            transaction.memo = transaction.MEMO.replace(', ', '\n');
            transaction.extra = parseOfxTransactionMemo(transaction.memo, transaction.postedAt);
            delete transaction.MEMO;

            transaction.id = transaction.FITID;
            delete transaction.FITID;

            transaction.amount = transaction.TRNAMT;
            delete transaction.TRNAMT;

            transaction.type = transaction.TRNTYPE;
            delete transaction.TRNTYPE;

            return transaction;
        });
    }

    return out;
}

function parseOfxTransactionMemo (memo, postedAt) {
    let out = {type: "", location: "", date: postedAt, client: ""};

    if (/^VISA/.test(memo)) {
        out.type = "Withdrawal through Credit";

        let month = parseInt(memo.substr(7, 2))-1;
        let date = memo.substr(10, 2);

        out.date = new Date(Date.UTC(postedAt.getFullYear(), month, date, 12));
    } else if (/^POINT OF SALE/.test(memo)) {
        out.type = "Withdrawal through Debit";
    } else if (/^ONLINE BANKING FUNDS TRANSFER/.test(memo)) {
        out.type = "Transfer through Web Site";
    } else if (/^FUNDS TRANSFER/.test(memo)) {
        out.type = "Transfer through App";
    } else if (/^AUTOMATIC WITHDRAWAL/.test(memo)) {
        out.type = "ACH Withdrawal";
    } else if (/^AUTOMATIC DEPOSIT/.test(memo)) {
        out.type = "ACH Deposit";
    } else if (/^DIVIDEND EARNED/.test(memo)) {
        out.type = "Deposit from Dividend";
    } else {
        out.type = null;
    }

    return out;
}

function parseOfxDate (dateString) {
    let out = dateString;

    let year = out.substr(0, 4);
    let month = parseInt(out.substr(4, 2))-1;
    let day = out.substr(6, 2);
    let hour = out.substr(8, 2);
    let minute = out.substr(10, 2);
    let second = out.substr(12, 2);
    let millisecond = out.substr(15, 3);

    out = new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));

    return out;
}