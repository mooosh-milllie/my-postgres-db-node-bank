const { default: axios } = require("axios");



const validateRoutingNumber = async(routingNumber) => {
  const {data} = await axios.get(`https://www.routingnumbers.info/api/data.json?rn=${routingNumber}`);
  return data;
}

module.exports = {validateRoutingNumber};

