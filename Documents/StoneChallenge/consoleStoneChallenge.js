const prompt = require('prompt-sync')();

const products = [];
const emails = [];

let i = 0;
let end = '';

while (end != 'Y'){
  products.push({});
  products[i].item = prompt('Insert the name of the product: ').trim();
  products[i].price = parseInt(prompt('Cool! How much does it cost? ').trim());
  products[i].numberOfItems = parseInt(prompt('And how many will be bought? ').trim());
  end = prompt('Is that all? (Y/N) ').trim().toUpperCase();
  i++;
}

i = 0;
end = '';

while (end != 'N' ){
  emails.push({})
  emails[i].name = prompt(`Insert the buyer's email: `);
  end = prompt('Is there another one? (Y/N) ').trim().toUpperCase();
  i++;
}

function stone(listItems, listEmails) {
  if(listItems.length === 0) {
    return console.error("Insert a valid item list.");
  }

  if(listEmails.length === 0) {
    return console.error("Insert a valid email list.");
  }

  let debtSum = 0;
  for(let i=0; i<listItems.length; i++){
    if(listItems[i].price < 0) {      
      return console.error(`The price for ${listItems[i].item} is not accepted.`);
    }
    debtSum += listItems[i].price * listItems[i].numberOfItems;
  }

  let paidDebt = 0

  for(let j=0; j<listEmails.length; j++){
    if (j === (listEmails.length - 1)){
      let debtNumber = (debtSum - paidDebt); 
      listEmails[j].myDebt = debtNumber;
    }
    else {
      let debtNumber = Math.round(debtSum/listEmails.length);      
      listEmails[j].myDebt = debtNumber;
      paidDebt += debtNumber;
    }
  }

  return listEmails;
}

const desafio = stone(products, emails);
console.log(desafio);
