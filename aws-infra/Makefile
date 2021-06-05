CDK=cdk --profile ${AWS_PROFILE}

all:
	npm run build

demo:
	$(CDK) deploy aws-net-security-demo-stack

diff:
	$(CDK) diff aws-net-security-demo-stack
del:
	$(CDK) destroy aws-net-security-demo-stack


exp:
	$(CDK) deploy AwsNetSecurityStack

rmexp:
	$(CDK) destroy AwsNetSecurityStack