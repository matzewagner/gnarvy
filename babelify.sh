echo -e '\033[1;33mTranspiling Gnarvy module to ES5 ...\033[0m'

if [ ! -e ./../../.babelrc ]; then
	echo "creating .babelrc file"
	echo '{
	"presets": [ "react-native" ]
}' >> ./../../.babelrc
fi

# if [ ! -e ./../cavy/cavy_es2015 ]; then
# 	echo "copying original cavy files to node_modules/cavy/cavy_es2015"
# 	mkdir ./../cavy/cavy_es2015
# 	cp -r ./../cavy/{src,index.js} ./../cavy/cavy_es2015
# fi

../.bin/babel ./es2015/index.js --out-file ./index.js --comments=true
./../.bin/babel ./es2015/src/ --out-dir ./src --comments=true
