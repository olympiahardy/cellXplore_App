# Minimal makefile for Sphinx documentation
#

SPHINXBUILD   = sphinx-build
SOURCEDIR     = source
BUILDDIR      = build

.PHONY: help clean html

help:
	@echo "Makefile for CellXplore Docs"
	@echo "  make html    to build the documentation"
	@echo "  make clean   to remove the build directory"

html:
	$(SPHINXBUILD) -M html "$(SOURCEDIR)" "$(BUILDDIR)" -a

clean:
	rm -rf "$(BUILDDIR)"