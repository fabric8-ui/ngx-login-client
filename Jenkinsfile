@Library('github.com/fabric8io/fabric8-pipeline-library@master')
def utils = new io.fabric8.Utils()
clientsNode{
    ws {
        checkout scm

        def releaseVersion
        container('clients'){
            releaseVersion = utils.getLatestVersionFromTag()
        }

        pushPackageJSONChangePR{
            propertyName = 'ngx-login-client'
            projects = [
                    'fabric8-ui/ngx-fabric8-wit',
                    'fabric8io/fabric8-ui'
            ]
            version = releaseVersion
        }
    }
}

