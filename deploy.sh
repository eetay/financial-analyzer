#!/bin/bash -x
#if [ -z "$AWS_EXEC" ]; then source ./aws-exec.sh ""; fi
ACTION=$1
MYDIR=`dirname $0`
STAGE=
STACK=FinancialAnalyzerStack$STAGE

case $ACTION in
  update|create)
    aws cloudformation ${ACTION}-stack --stack-name $STACK \
      --template-body file://./cloudformation.yaml \
      --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
      --parameters \
        ParameterKey=Stage,ParameterValue=$STAGE
    ./cloudformation-tail.sh $STACK $AWS_REGION $AWS_PROFILE
    ;;
  deploy)
    ZIP=taseGetInfoLambda.zip
    pushd taseGetInfoLambda > /dev/null && zip ../dist/$ZIP -r . && popd > /dev/null
    aws lambda update-function-code --function-name $STACK-TaseGetInfoLambda --zip-file fileb://./dist/$ZIP
    ;;
  delete)
    aws cloudformation delete-stack --stack-name $STACK
    ./cloudformation-tail.sh $STACK $AWS_REGION $AWS_PROFILE
    ;;
  *)
    echo "Usage: $0 [create|delete|update]"
    ;;
esac
