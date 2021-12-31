Feature: Code Count
    Scenario: Count Code in Folders
        Given I have code in folder '<folder>'
        When I run a code count
        Then there are <files> files
        * containing <blanks> blank lines
        * <comments> lines of comments
        * <code> lines of code
        * writen in the language '<language>'
        Examples:
            | folder                      | language                   | files | blanks | comments | code |
            | acpclust.R                  | R                          | 1     | 54     | 35       | 170  |
            | arvo.hoon                   | Hoon                       | 1     | 0      | 10       | 110  |
            | asciidoctor.adoc            | AsciiDoc                   | 1     | 17     | 27       | 34   |
            | Assembler-Intel.asm         | Assembly                   | 1     | 2      | 2        | 9    |
            | assembly-sysv.S             | Assembly                   | 1     | 38     | 108      | 188  |
            | birds.pro                   | Prolog                     | 1     | 42     | 8        | 112  |
            | blur.glsl                   | GLSL                       | 1     | 10     | 14       | 32   |
            | bubs_tak_ard.prc            | Oracle PL/SQL              | 1     | 0      | 15       | 67   |
            | BUILD                       | Bazel                      | 1     | 7      | 1        | 26   |
            | build.bzl                   | Starlark                   | 1     | 3      | 4        | 11   |
            | build.cake                  | Cake Build Script          | 1     | 6      | 6        | 28   |
            | c#-assembly                 | C#                         | 1     | 4      | 4        | 9    |
            | C#.cs                       | C#                         | 1     | 2      | 2        | 9    |
            | C++-MFC.cc                  | C++                        | 1     | 5      | 3        | 22   |
            | C++-uppercase.CPP           | C++                        | 1     | 2      | 1        | 1    |
            | C-Ansi.c                    | C                          | 1     | 2      | 2        | 7    |
            | C.g4                        | ANTLR Grammar              | 1     | 152    | 40       | 755  |
            | captcha.cs                  | Smalltalk                  | 1     | 4      | 3        | 20   |
            | capture.ecr                 | Embedded Crystal           | 1     | 4      | 4        | 14   |
            | certificates.sls            | SaltStack                  | 1     | 6      | 1        | 55   |
            | Chapel.chpl                 | Chapel                     | 1     | 7      | 35       | 6    |
            | chat.st                     | Smalltalk                  | 1     | 15     | 2        | 65   |
            | child_template.jinja2       | Jinja Template             | 1     | 0      | 6        | 10   |
            | class.imba                  | Imba                       | 1     | 71     | 30       | 108  |
            | cloc_counts.csv             | CSV                        | 1     | 0      | 0        | 158  |
            | clusterConf.ttcn            | TTCN                       | 1     | 11     | 16       | 19   |
            | Cobol.cbl                   | COBOL                      | 1     | 1      | 4        | 8    |
            | ColdFusion.cfm              | ColdFusion                 | 1     | 1      | 2        | 2    |
            | Combinators.idr             | Idris                      | 1     | 35     | 79       | 111  |
            | comp.ecpp                   | ECPP                       | 1     | 26     | 34       | 116  |
            | conditions.CBL              | COBOL                      | 1     | 3      | 3        | 25   |
            | config.junos                | Juniper Junos              | 1     | 0      | 8        | 129  |
            | Counter.razor               | Razor                      | 1     | 6      | 3        | 13   |
            | csharp-designer.designer.cs | C# Designer                | 1     | 8      | 22       | 28   |
            | cucumber.feature            | Cucumber                   | 1     | 3      | 2        | 28   |
            | darwin-configuration.nix    | Nix                        | 1     | 15     | 15       | 43   |
            | demo.odin                   | Odin                       | 1     | 32     | 56       | 90   |
            | DIEnumerator-10.0.ll        | LLVM IR                    | 1     | 2      | 6        | 3    |
            | dlist.lean                  | Lean                       | 1     | 36     | 20       | 90   |
            | Dockerfile                  | Dockerfile                 | 1     | 4      | 1        | 53   |
            | DocTest.thrift              | Thrift                     | 1     | 57     | 134      | 97   |
            | door.tres                   | Godot Resource             | 1     | 2      | 8        | 20   |
            | drools.drl                  | Drools                     | 1     | 7      | 16       | 28   |
            | drupal.mxml                 | MXML                       | 1     | 23     | 5        | 74   |
            | elixir.ex                   | Elixir                     | 1     | 3      | 10       | 7    |
            | en_AU.po                    | PO File                    | 1     | 9      | 18       | 33   |
            | ExprParser.g                | ANTLR Grammar              | 1     | 48     | 19       | 257  |
            | find.plm                    | PL/M                       | 1     | 1      | 5        | 19   |
            | FOCUS.focexec               | Focus                      | 1     | 1      | 2        | 1    |
            | Fortran77.f                 | Fortran 77                 | 1     | 1      | 2        | 3    |
            | Fortran90.f90               | Fortran 90                 | 1     | 1      | 2        | 3    |
            | fractal.um                  | Umka                       | 1     | 7      | 5        | 26   |
            | FreemarkerTemplate.ftl      | Freemarker Template        | 1     | 0      | 2        | 27   |
            | fsharp.fs                   | F#                         | 1     | 3      | 6        | 14   |
            | fsharp_script.fsx           | F# Script                  | 1     | 1      | 2        | 8    |
            | GamePanel.tscn              | Godot Scene                | 1     | 4      | 8        | 34   |
            | Gencat-NLS.msg              | Gencat NLS                 | 1     | 1      | 4        | 15   |
            | generate.fnl                | Fennel                     | 1     | 6      | 3        | 44   |
            | git_helpers.fish            | Fish Shell                 | 1     | 14     | 47       | 62   |
            | glade-search-popover.ui     | Glade                      | 1     | 0      | 22       | 232  |
            | glossary.json               | JSON                       | 1     | 0      | 0        | 22   |
            | glossary.json5              | JSON5                      | 1     | 0      | 4        | 22   |
            | gnureadline.vala            | Vala                       | 1     | 0      | 5        | 9    |
            | graphql.gql                 | GraphQL                    | 1     | 1      | 2        | 14   |
            | greeter.tsx                 | TypeScript                 | 1     | 2      | 5        | 7    |
            | groovy_triple.gvy           | Groovy                     | 1     | 0      | 2        | 6    |
            | guestbook.tpl               | Smarty                     | 1     | 1      | 1        | 21   |
            | harbour_xbase.prg           | xBase                      | 1     | 0      | 9        | 1    |
            | Haskell.hs                  | Haskell                    | 1     | 1      | 2        | 3    |
            | hello.bf                    | Brainfuck                  | 1     | 1      | 8        | 19   |
            | hello.C                     | C++                        | 1     | 0      | 2        | 6    |
            | hello.f                     | Fortran 77                 | 1     | 0      | 4        | 6    |
            | hello.f90                   | Fortran 90                 | 1     | 0      | 3        | 4    |
            | hello.java                  | Java                       | 1     | 0      | 3        | 6    |
            | hello.kt                    | Kotlin                     | 1     | 0      | 3        | 9    |
            | Hello.lidr                  | Literate Idris             | 1     | 2      | 2        | 3    |
            | hello.lua                   | Lua                        | 1     | 3      | 9        | 2    |
            | hello.pas                   | Pascal                     | 1     | 1      | 4        | 4    |
            | hello.pl1                   | PL/I                       | 1     | 0      | 7        | 5    |
            | hello.sp                    | SparForte                  | 1     | 6      | 8        | 8    |
            | hello1.pas                  | Pascal                     | 1     | 1      | 5        | 6    |
            | helloworld.raml             | RAML                       | 1     | 5      | 3        | 62   |
            | hello_app.go                | Go                         | 1     | 5      | 18       | 11   |
            | hello_app_autogen.go        | Go                         | 1     | 5      | 19       | 11   |
            | hi.py                       | Python                     | 1     | 4      | 11       | 2    |
            | i18n_de.ts                  | Qt Linguist                | 1     | 0      | 4        | 57   |
            | iclean.icl                  | Clean                      | 1     | 10     | 30       | 58   |
            | IDL.idl                     | IDL                        | 1     | 0      | 2        | 1    |
            | idris_block_comments.idr    | Idris                      | 1     | 3      | 11       | 6    |
            | igorpro.ipf                 | Igor Pro                   | 1     | 4      | 6        | 19   |
            | includes_demo.mustache      | Mustache                   | 1     | 1      | 3        | 16   |
            | insertJournalEntry.ipl      | IPL                        | 1     | 6      | 15       | 33   |
            | ItemView.vue                | Vuejs Component            | 1     | 10     | 2        | 85   |
            | Java.java                   | Java                       | 1     | 6      | 15       | 9    |
            | JetCar.cls                  | Visual Basic               | 1     | 19     | 15       | 28   |
            | julia.jl                    | Julia                      | 1     | 3      | 11       | 4    |
            | just_stuff.haml             | Haml                       | 1     | 5      | 16       | 66   |
            | Lanczos.m                   | MATLAB                     | 1     | 0      | 0        | 48   |
            | LaTeX.tex                   | TeX                        | 1     | 29     | 21       | 155  |
            | layout.dt                   | DIET                       | 1     | 10     | 4        | 230  |
            | locale_facets.h             | C/C++ Header               | 1     | 191    | 779      | 618  |
            | LogMain.re                  | ReasonML                   | 1     | 2      | 8        | 4    |
            | logos.x                     | Logos                      | 1     | 3      | 1        | 8    |
            | logos.xm                    | Logos                      | 1     | 3      | 2        | 8    |
            | logtalk.lgt                 | Logtalk                    | 1     | 59     | 57       | 368  |
            | Lookup.agda                 | Agda                       | 1     | 10     | 3        | 38   |
            | Makefile                    | make                       | 1     | 22     | 49       | 62   |
            | Mako.mako                   | Mako                       | 1     | 3      | 8        | 9    |
            | master.blade.php            | Blade                      | 1     | 10     | 5        | 22   |
            | Mathematica_1.m             | Mathematica                | 1     | 12     | 8        | 11   |
            | Mathematica_2.wlt           | Mathematica                | 1     | 12     | 9        | 11   |
            | matlab_line_colors.m        | MATLAB                     | 1     | 3      | 10       | 18   |
            | md5.rkt                     | Racket                     | 1     | 32     | 159      | 247  |
            | meson.build                 | Meson                      | 1     | 13     | 9        | 48   |
            | messages.rb                 | Ruby                       | 1     | 11     | 31       | 110  |
            | mfile.mk                    | make                       | 1     | 27     | 37       | 76   |
            | modules1-func1.pp           | Puppet                     | 1     | 0      | 2        | 3    |
            | modules1-func2.pp           | Puppet                     | 1     | 0      | 2        | 3    |
            | modules1-ntp1.pp            | Puppet                     | 1     | 2      | 2        | 27   |
            | modules1-typealias.pp       | Puppet                     | 1     | 0      | 2        | 1    |
            | Mojo.mojom                  | Mojo                       | 1     | 6      | 4        | 17   |
            | MSDOS.bat                   | DOS Batch                  | 1     | 1      | 2        | 2    |
            | Mumps.mps                   | MUMPS                      | 1     | 0      | 2        | 1    |
            | nested.lua                  | Lua                        | 1     | 4      | 23       | 2    |
            | nomad_job.hcl               | HashiCorp HCL              | 1     | 14     | 36       | 43   |
            | Octave.m                    | MATLAB                     | 1     | 0      | 1        | 2    |
            | offline.jcl                 | JCL                        | 1     | 0      | 18       | 44   |
            | pages.wxml                  | WXML                       | 1     | 3      | 2        | 8    |
            | pages.wxss                  | WXSS                       | 1     | 0      | 1        | 3    |
            | page_layout.aspx            | ASP.NET                    | 1     | 8      | 6        | 23   |
            | Pascal.pas                  | Pascal                     | 1     | 1      | 2        | 4    |
            | Pascal.pp                   | Pascal                     | 1     | 1      | 4        | 4    |
            | ping_pong.lfe               | LFE                        | 1     | 15     | 21       | 25   |
            | plantuml.puml               | PlantUML                   | 1     | 2      | 5        | 5    |
            | pop_by_country.xq           | XQuery                     | 1     | 0      | 1        | 1    |
            | Prelude.dhall               | dhall                      | 1     | 6      | 17       | 3    |
            | prob060-andreoss.p6         | Raku                       | 1     | 19     | 12       | 39   |
            | ProcessPO.odx               | BizTalk Orchestration      | 1     | 1      | 3        | 90   |
            | proguard-project-app.pro    | ProGuard                   | 1     | 7      | 14       | 3    |
            | qsort_demo.m                | Objective-C                | 1     | 11     | 11       | 25   |
            | rand.apl                    | APL                        | 1     | 3      | 6        | 4    |
            | razor.cshtml                | Razor                      | 1     | 0      | 4        | 4    |
            | reactive.svelte             | Svelte                     | 1     | 2      | 2        | 9    |
            | RedBlackTree.res            | ReScript                   | 1     | 31     | 43       | 157  |
            | regex_limit.gradle          | Gradle                     | 1     | 0      | 2        | 17   |
            | RemoteSiteHelperTest.cls    | Apex Class                 | 1     | 3      | 6        | 28   |
            | RenderTest.metal            | Metal                      | 1     | 13     | 10       | 40   |
            | reStructuredText.rst        | reStructuredText           | 1     | 6      | 4        | 10   |
            | robotframework.robot        | RobotFramework             | 1     | 9      | 5        | 35   |
            | roku.brs                    | BrightScript               | 1     | 0      | 3        | 19   |
            | rules.sss                   | SugarSS                    | 1     | 5      | 4        | 13   |
            | sample.ejs                  | EJS                        | 1     | 0      | 11       | 34   |
            | Sample.mc                   | Windows Message File       | 1     | 16     | 6        | 64   |
            | sample.R                    | R                          | 1     | 0      | 1        | 4    |
            | scheme.sls                  | Scheme                     | 1     | 10     | 18       | 78   |
            | script1-hadoop.pig          | Pig Latin                  | 1     | 19     | 40       | 15   |
            | server_side.aspx            | ASP.NET                    | 1     | 8      | 15       | 16   |
            | sharpsign.cl                | Lisp                       | 1     | 5      | 28       | 22   |
            | Slim.html.slim              | Slim                       | 1     | 0      | 3        | 10   |
            | solidity.sol                | Solidity                   | 1     | 0      | 2        | 19   |
            | specman_e.e                 | Specman e                  | 1     | 1      | 8        | 19   |
            | specman_e2.e                | Specman e                  | 1     | 3      | 4        | 12   |
            | squirrel_table.nut          | Squirrel                   | 1     | 6      | 4        | 31   |
            | stata.do                    | Stata                      | 1     | 7      | 7        | 22   |
            | statcsv.nim                 | Nim                        | 1     | 5      | 13       | 43   |
            | streamlines.pro             | IDL                        | 1     | 25     | 5        | 13   |
            | string.gleam                | Gleam                      | 1     | 6      | 41       | 21   |
            | style.scss                  | SCSS                       | 1     | 14     | 4        | 39   |
            | SVG_logo.svg                | SVG                        | 1     | 19     | 4        | 242  |
            | swig_example.i              | SWIG                       | 1     | 4      | 4        | 15   |
            | Sys.hx                      | Haxe                       | 1     | 26     | 99       | 24   |
            | temp.c                      | C                          | 1     | 2      | 0        | 3    |
            | test.hs                     | Haskell                    | 1     | 5      | 5        | 9    |
            | test.Rmd                    | Rmd                        | 1     | 10     | 19       | 4    |
            | test1.inc                   | PHP                        | 1     | 5      | 7        | 11   |
            | test1.lhs                   | Haskell                    | 1     | 5      | 8        | 2    |
            | test1.php                   | PHP                        | 1     | 6      | 6        | 15   |
            | test2.lhs                   | Haskell                    | 1     | 12     | 11       | 21   |
            | tictactoe3d.ring            | Ring                       | 1     | 11     | 11       | 38   |
            | Tk                          | Tcl/Tk                     | 1     | 1      | 2        | 3    |
            | tnsdl.sdl                   | TNSDL                      | 1     | 5      | 3        | 15   |
            | toml_example.toml           | TOML                       | 1     | 8      | 4        | 22   |
            | tour.swift                  | Swift                      | 1     | 23     | 13       | 65   |
            | Trapezoid_Rule.ipynb        | Jupyter Notebook           | 1     | 0      | 62       | 85   |
            | type.wast                   | WebAssembly                | 1     | 8      | 20       | 32   |
            | TypeScript.ts               | TypeScript                 | 1     | 11     | 23       | 60   |
            | TypeScript_2.ts             | TypeScript                 | 1     | 1      | 0        | 6    |
            | utilities.R                 | R                          | 1     | 41     | 276      | 524  |
            | vbox.fxml                   | FXML                       | 1     | 2      | 3        | 8    |
            | verilog.sv                  | Verilog-SystemVerilog      | 1     | 4      | 20       | 62   |
            | VisualBasic.Net.vba         | VB for Applications        | 1     | 4      | 2        | 6    |
            | vs_solution.sln             | Visual Studio Solution     | 1     | 0      | 1        | 25   |
            | vtl.vm                      | Velocity Template Language | 1     | 0      | 20       | 13   |
            | warship.ts                  | TypeScript                 | 1     | 39     | 11       | 343  |
            | webservice.wsdl             | Web Services Description   | 1     | 4      | 0        | 36   |
            | wiki.properties             | Properties                 | 1     | 0      | 15       | 9    |
            | wokka.cbl                   | COBOL                      | 1     | 1      | 1        | 2    |
            | wokka.cs                    | C#                         | 1     | 2      | 1        | 5    |
            | wpedia.ini                  | INI                        | 1     | 2      | 3        | 7    |
            | x.mustache                  | Mustache                   | 1     | 4      | 6        | 13   |
            | XML.xml                     | XML                        | 1     | 0      | 2        | 3    |
            | XmlToJSONSendPipeline.btp   | BizTalk Pipeline           | 1     | 0      | 0        | 55   |
            | XSL-FO.xsl                  | XSLT                       | 1     | 0      | 2        | 13   |
            | XSLT.xslt                   | XSLT                       | 1     | 0      | 2        | 6    |
            | Xtend.xtend                 | Xtend                      | 1     | 17     | 52       | 91   |
            | zir_sema.zig                | Zig                        | 1     | 2      | 10       | 128  |
            | ZosMsg.mc                   | Windows Message File       | 1     | 73     | 3        | 284  |
            | ZosNet.rc                   | Windows Resource File      | 1     | 42     | 45       | 218  |
            | ZosNp.def                   | Windows Module Definition  | 1     | 1      | 1        | 18   |
            | zos_assembly.s              | Assembly                   | 1     | 0      | 30       | 7    |

# Exception applying filter decomment in definition Velocity Template Language
# unrecognized filter method decomment in Velocity Template Language
# Exception applying filter add-newlines in definition Velocity Template Language
# unrecognized filter method add-newlines in Velocity Template Language
