const commonFields = `
    $name: String,
    $description: String
`;

const commonVariables = `
    name: $name,
    description: $description,
`;


const posAdd = `
  mutation posAdd(${commonFields}) {
    posAdd(${commonVariables}){
        _id
        name
        description
    }
  }
`;

const podEdit = `
  mutation podEdit($_id: String, ${commonFields}) {
    podEdit(_id: $_id, ${commonVariables}){
        _id
        name
        description
    }
  }
`;

const posRemove = `
  mutation posRemove($_id: String!) {
    posRemove(_id: $_id)
  }
`;

const updateConfigs = `
  mutation posConfigsUpdate($posId:String!, $configsMap: JSON!) {
    posConfigsUpdate(posId: $posId, configsMap: $configsMap)
  }
`;

export default {
  posAdd,
  podEdit,
  posRemove,
  updateConfigs
};
