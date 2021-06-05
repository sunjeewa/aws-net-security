/**
 * @description
 * This is EC2 construct for WebServer and Network Monitor
 */

import { Stack, Construct, RemovalPolicy, CfnResource } from "@aws-cdk/core";
import {
  Vpc,
  Instance,
  InstanceType,
  InitFile,
  InitService,
  InitServiceRestartHandle,
  CloudFormationInit,
  MachineImage,
  AmazonLinuxVirt,
  AmazonLinuxGeneration,
  AmazonLinuxCpuType,
  SecurityGroup,
  Peer,
  Port,
  InitPackage,
} from "@aws-cdk/aws-ec2";
import {
  LogGroup,
  RetentionDays,
  CfnSubscriptionFilter,
} from "@aws-cdk/aws-logs";

import ec2 = require("@aws-cdk/aws-ec2")
import iam = require("@aws-cdk/aws-iam")
import { Effect, PolicyStatement } from "@aws-cdk/aws-iam";

/**
 * @interface
 * @description web server interface
 */
interface IEC2Demo {
  /**
   * @description vpc for creating demo resources
   * @type {Vpc}
   */
  demoVpc: Vpc;
}

/**
 * @class
 * @description web server resources construct
 * @property {string} region of deployment
 */
export class EC2Demo extends Construct {
  readonly region: string;
  readonly publicIp: string;
  constructor(scope: Construct, id: string, props: IEC2Demo) {
    super(scope, id);

    const stack = Stack.of(this);

    this.region = stack.region; // Returns the AWS::Region for this stack (or the literal value if known)

    /**
     * @description security group for web server
     * @type {SecurityGroup}
     */
    const demoSg: SecurityGroup = new SecurityGroup(this, "DemoSG", {
      vpc: props.demoVpc,
    });
    demoSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "allow HTTP traffic");
    (demoSg.node.defaultChild as CfnResource).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W40",
            reason: "Demo resource",
          },
          {
            id: "W5",
            reason: "Demo resource",
          },
          {
            id: "W9",
            reason: "Demo resource",
          },
          {
            id: "W2",
            reason: "Demo resource",
          },
        ],
      },
    };

    /**
     * @description log group for web server
     * @type {LogGroup}
     */
    const ec2Lg: LogGroup = new LogGroup(this, "EC2LogGroup", {
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_WEEK,
    });

    const handle: InitServiceRestartHandle = new InitServiceRestartHandle();

    /**
     * @description cloudformation init configuration for web server
     * @type {CloudFormationInit}
     */
    const init: CloudFormationInit = CloudFormationInit.fromElements(
      InitPackage.yum("httpd", { serviceRestartHandles: [handle] }),
      InitPackage.yum("php", { serviceRestartHandles: [handle] }),
      InitPackage.yum("amazon-cloudwatch-agent", {
        serviceRestartHandles: [handle],
      }),
      InitFile.fromObject("/tmp/cw-config.json", {
        agent: {
          run_as_user: "root",
        },
        logs: {
          logs_collected: {
            files: {
              collect_list: [
                {
                  file_path: "/var/log/httpd/access_log",
                  log_group_name: ec2Lg.logGroupName,
                  log_stream_name: "{instance_id}/apache.log",
                  timezone: "UTC",
                },
              ],
            },
          },
        },
      }),
      InitFile.fromString(
        "/var/www/html/index.php",
        `<?php
        echo '<h1>AWS CloudFormation sample PHP application</h1>';
        ?>`,
        {
          mode: "000644",
          owner: "apache",
          group: "apache",
          serviceRestartHandles: [handle],
        }
      ),
      InitService.enable("httpd", {
        enabled: true,
        ensureRunning: true,
        serviceRestartHandle: handle,
      })
    );

    /**
     * @description web server instance
     * @type {Instance}
     */
    const demoEC2: Instance = new Instance(this, "DemoEC2", {
      vpc: props.demoVpc,
      instanceType: new InstanceType("t3.small"),
      machineImage: MachineImage.latestAmazonLinux({
        virtualization: AmazonLinuxVirt.HVM,
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: AmazonLinuxCpuType.X86_64,
      }),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      init: init,
      allowAllOutbound: true,
      securityGroup: demoSg,
    });

    demoEC2.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"))
    

    demoEC2.addUserData(
      "curl 127.0.0.1"
    );

    this.publicIp = demoEC2.instancePublicIp;
  }
}




/**
 * @interface
 * @description web server interface
 */
interface IEC2NetworkMonitor {
  /**
   * @description vpc for creating EC2 instance
   * @type {Vpc}
   */
  vpc: Vpc;
}


/**
 * @class EC2NetworkMonitor 
 * @description Network Monitor resources construct
 * @property {string} region of deployment
 */
export class EC2NetworkMonitor extends Construct {
  readonly region: string;
  readonly publicIp: string;
  constructor(scope: Construct, id: string, props: IEC2NetworkMonitor) {
    super(scope, id);
    const stack = Stack.of(this);
    this.region = stack.region; // Returns the AWS::Region for this stack (or the literal value if known)

    /**
     * @description security group for web server
     * @type {SecurityGroup}
     */
    const demoSg: SecurityGroup = new SecurityGroup(this, "DemoSG", {
      vpc: props.vpc,
    });

    demoSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "allow HTTP traffic");
    (demoSg.node.defaultChild as CfnResource).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W40",
            reason: "Network Monitor resource",
          }
        ],
      },
    };

    /**
     * @description log group 
     * @type {LogGroup}
     */
    const ec2Lg: LogGroup = new LogGroup(this, "EC2LogGroup", {
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_WEEK,
    });

    const handle: InitServiceRestartHandle = new InitServiceRestartHandle();


    /*
    # Become sudo
sudo -s
# Install epel-release
amazon-linux-extras install -y epel
# Install suricata
yum install -y suricata
# Create the default suricata rules directory
mkdir /var/lib/suricata/rules
# Add a rule to match all UDP traffic

echo 'alert udp any any -> any any (msg:"UDP traffic detected"; sid:200001; rev:1;)' > /var/lib/suricata/rules/suricata.rules
# Start suricata listening on eth0 in daemon mode
suricata -c /etc/suricata/suricata.yaml -k none -i eth0 -D

# Capture logs can be found in /var/log/suricata/fast.log 

    */

    /**
     * @description cloudformation init configuration
     * @type {CloudFormationInit}
     */
    const init: CloudFormationInit = CloudFormationInit.fromElements(
      //ec2.InitCommand.shellCommand("amazon-linux-extras install -y epel"),
      //ec2.InitCommand.shellCommand("yum install -y suricata"),
      ec2.InitCommand.shellCommand("mkdir /var/lib/suricata/rules"),
      InitFile.fromString("/var/lib/suricata/rules/suricata.rules",
        `alert udp any any -> any any (msg:"UDP traffic detected"; sid:200001; rev:1;)`
      ),
    );

    /**
     * @description EC2 instance
     * @type {Instance}
     */
    const NetworkMonitor : Instance = new Instance(this, "NetworkMonitor", {
      vpc: props.vpc,
      instanceType: new InstanceType("t3.small"),
      machineImage: MachineImage.latestAmazonLinux({
        virtualization: AmazonLinuxVirt.HVM,
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: AmazonLinuxCpuType.X86_64,
      }),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE,
      },
      //init: init,
      allowAllOutbound: true,
      securityGroup: demoSg,
    });
    
    NetworkMonitor.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"))

    NetworkMonitor.addUserData(
      "curl 127.0.0.1"
    );
  }
}
