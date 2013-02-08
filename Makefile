APP_CFG = app_config.prod.json
DEV_ROOT = root/
PROD_ROOT = prod_root/
JADE = $(DEV_ROOT)index.jade
IGNORE_IN_PROD=.* *~ *.jade js_dir.json
UGLIFYJS_OPTS=-b -nm -nmf -ns 

HTML = $(JADE:.jade=.html)
IGNORE_STATIC = $(foreach f,$(IGNORE_IN_PROD),! -name '$f')
CLIENT_JS=./client_js_files.js
UTIL_JS=./util.js


all: $(PROD_ROOT) static js-min $(HTML)

deploy:
	@if [ `git branch | sed -n -e 's/^\* \(.*\)/\1/p'` != 'master' ]; then \
		echo "Must be run from master branch"; \
		false; \
	fi;
	@echo "===> Checkout 'heroku' branch"
	git checkout heroku
	@echo "===> Merging 'master' branch"
	git merge master
	@echo "===> Making 'all' in 'heroku'"
	make all
	@echo "===> Commiting changes to 'heroku'"
	git commit -a -m '...'
	@echo "===> Push 'heroku' branch to heroku"
	git push heroku  heroku:master
	@echo "===> Checkout 'master' branch back"
	git checkout master
	@echo "===> Deploy done :)"

js-min:
	mkdir -p $(PROD_ROOT)/js/
	rm -f $(PROD_ROOT)/js/bundle.js;
	for f in `$(CLIENT_JS) listBundle $(DEV_ROOT)js/`; do \
			echo Including $$f in bundle.js;\
			echo "// >>> $$f" >> $(PROD_ROOT)/js/bundle.js;\
			cat $(DEV_ROOT)/js/$$f >> $(PROD_ROOT)/js/bundle.js;\
			echo "// <<< $$f" >> $(PROD_ROOT)/js/bundle.js;\
		done;
	for f in `$(CLIENT_JS) listNotInBundle $(DEV_ROOT)/js/`; do \
			echo Copying $$f;\
			cp -f $(DEV_ROOT)/js/$$f $(PROD_ROOT)js/;\
		done;
	for f in $(PROD_ROOT)js/* ; do \
			if [ -f $$f ] ; then \
				echo Uglifying $$f;\
				node_modules/.bin/uglifyjs $$f $(UGLIFYJS_OPTS)  --output $$f; \
			fi;\
		done;

static:
	(cd $(DEV_ROOT) ;\
		find  -path './js' -prune -o $(IGNORE_STATIC) -print) |\
		while read f; do\
			[ -d "$(DEV_ROOT)$$f" ] && mkdir -vp "$(PROD_ROOT)$$f";\
			[ -f "$(DEV_ROOT)$$f" ] && cp -v "$(DEV_ROOT)$$f" "$(PROD_ROOT)$$f";\
		done;

%.html: %.jade
	LANGS=`$(UTIL_JS) readCfg LANGS | sed 's,_.*$$,,'`;\
	for lang in $$LANGS; do \
		mkdir -p $(PROD_ROOT)/$$lang; \
		fname=`echo $< | sed "s/.jade$$/.$${lang}.jade/"`; \
		echo Compiling $${fname}; \
		./jade_compile.js $${fname} > $(PROD_ROOT)$${lang}/$(notdir $@); \
	done

$(PROD_ROOT):
	mkdir $@

clean:
	rm -r $(PROD_ROOT)

.PHONY: clean
