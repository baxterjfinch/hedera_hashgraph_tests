const { Client, PrivateKey, AccountCreateTransaction, AccountBalanceQuery, Hbar, TransferTransaction } = require("@hashgraph/sdk");
require("dotenv").config();

async function main() {

    //Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    // If we weren't able to grab it, we should throw a new error
    if (myAccountId == null ||
        myPrivateKey == null ) {
        throw new Error("Environment variables myAccountId and myPrivateKey must be present");
    }

    // Create our connection to the Hedera network
    // The Hedera JS SDK makes this reallyyy easy!
    const client = Client.forTestnet();

    client.setOperator(myAccountId, myPrivateKey);

    createAccount(client).then((newAccount) => {
      return createTransfer(client, myAccountId, newAccount, 1000)

    }).catch((err) => {
      console.log(err)
    });
}

async function createAccount(client) {
  //Create new keys
  const newAccountPrivateKey = await PrivateKey.generate();
  const newAccountPublicKey = newAccountPrivateKey.publicKey;

  //Create a new account with 1,000 tinybar starting balance
  const newAccountTransactionResponse = await new AccountCreateTransaction()
      .setKey(newAccountPublicKey)
      .setInitialBalance(Hbar.fromTinybars(1000))
      .execute(client);


    const getReceipt = await newAccountTransactionResponse.getReceipt(client);
    const newAccountId = getReceipt.accountId;

    //Verify the account balance
    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(newAccountId)
        .execute(client);

    console.log("The new account balance is: " +accountBalance.hbars.toTinybars() +" tinybar.");
    return newAccountId;
}
async function createTransfer(client, fromAccount, toAccount, amount) {

  const transferTransactionResponse = await new TransferTransaction()
       .addHbarTransfer(fromAccount, Hbar.fromTinybars(-amount)) //Sending account
       .addHbarTransfer(toAccount, Hbar.fromTinybars(amount)) //Receiving account
       .execute(client);
       //Verify the transaction reached consensus
    const transactionReceipt = await transferTransactionResponse.getReceipt(client);
    console.log("The transfer transaction from my account to the new account was: " + transactionReceipt.status.toString());

    const getBalanceCost = await new AccountBalanceQuery()
     .setAccountId(toAccount)
     .getCost(client);

    console.log("The cost of query is: " + getBalanceCost);

     //Check the new account's balance
    const getNewBalance = await new AccountBalanceQuery()
       .setAccountId(toAccount)
       .execute(client);

    console.log("The account balance after the transfer is: " + getNewBalance.hbars.toTinybars() +" tinybar.")
}
main();
