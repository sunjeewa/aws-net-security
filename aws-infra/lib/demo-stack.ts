import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import { EC2Demo } from "./cl-demo-ec2-construct";
import { EC2NetworkMonitor} from "./cl-demo-ec2-construct";

export class AwsNetSecurityDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // IP to Block
    const ip = "10.10.1.1/32"

    const vpc = new ec2.Vpc(this,"vpc",{
      cidr: "192.168.0.0/16",
      natGateways: 1,
      maxAzs: 2,
      vpnGateway: false,
    })

    //====================
    // WebServer resources
    //====================

     const werbserver : EC2Demo = new EC2Demo(this, "WebServer", {
      demoVpc: vpc,
    })


    const nacls = ec2.NetworkAcl.fromNetworkAclId(this,"nacls",vpc.vpcDefaultNetworkAcl)

    new cdk.CfnOutput(this,"naclid",{
      value: nacls.networkAclId
    })

    nacls.addEntry("blockHttp",{
      cidr: ec2.AclCidr.ipv4(ip),
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
      ruleNumber: 1,
      ruleAction: ec2.Action.ALLOW,
      networkAclEntryName: "Allow All"
    })


    const  TrafficScanner = new EC2NetworkMonitor(this,"TrafficScanner",{
      vpc:vpc
    })

  //   //#########################################################################
  //   //# Section: Traffic Scaner Instance                                        #
  //   //#########################################################################
  //   const TrafficScannerSG = new ec2.SecurityGroup(this,"TrafficScannerSG",{
  //     vpc: vpc,
  //     allowAllOutbound: true,
  //   }) 

  //   // -- Shared Instance Profile
  //   const Role = new iam.Role(this, 'Role', {
  //     assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
  //   })
  //   // Add Permission for SSM
  //   Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"))

  //   const InstanceProfile = new iam.CfnInstanceProfile(this, "InstanceProfile", {
  //     roles: [Role.roleName],
  //     path: "/"
  //   })


  //   const TrafficScanner = new ec2.CfnInstance(this, "TrafficScanner", {
  //     disableApiTermination: false,
  //     iamInstanceProfile: InstanceProfile.ref,
  //     imageId: ec2.MachineImage.latestAmazonLinux({
  //       virtualization: ec2.AmazonLinuxVirt.HVM,
  //       generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
  //       cpuType: ec2.AmazonLinuxCpuType.X86_64,
  //     }).getImage(this).imageId,
  //     keyName: cdk.Aws.ACCOUNT_ID,
  //     tags: [
  //       { 'key': 'Name', 'value': 'TrafficScanner' },
  //       { 'key': 'Group', 'value': 'Web' },
  //     ],
  //     ebsOptimized: true,
  //     subnetId: vpc.privateSubnets[0].subnetId,
  //     securityGroupIds: [
  //      TrafficScannerSG.securityGroupId
  //     ],
  //     instanceType: ec2.InstanceType.of(
  //       ec2.InstanceClass.T3,
  //       ec2.InstanceSize.SMALL
  //     ).toString(),
  //     blockDeviceMappings: [
  //       {
  //         deviceName: '/dev/sda1',
  //         ebs: {
  //           volumeSize: 20,
  //           deleteOnTermination: true,
  //           volumeType: ec2.EbsDeviceVolumeType.GP2
  //         }
  //       }
  //     ]
  //   })

  //   // ENIs 
  //   const TrafficScannerENI = new ec2.CfnNetworkInterface(this, "TrafficScannerENI", {
  //     subnetId: vpc.privateSubnets[0].subnetId,
  //     tags: [
  //       { 'key': 'Name', 'value': 'TrafficScannerENI' }
  //     ],
  //     groupSet: [TrafficScannerSG.securityGroupId]

  //   })

  //  // Associate 
  //   new ec2.CfnNetworkInterfaceAttachment(this, "TrafficScannerENINetworkInterfaceAttachment", {
  //     deviceIndex: "1",
  //     instanceId: TrafficScanner.ref,
  //     networkInterfaceId: TrafficScannerENI.ref,
  //     deleteOnTermination: true 
  //   })





    // -- end of resources

  }
}
