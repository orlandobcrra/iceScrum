%{--
- Copyright (c) 2010 iceScrum Technologies.
-
- This file is part of iceScrum.
-
- iceScrum is free software: you can redistribute it and/or modify
- it under the terms of the GNU Affero General Public License as published by
- the Free Software Foundation, either version 3 of the License.
-
- iceScrum is distributed in the hope that it will be useful,
- but WITHOUT ANY WARRANTY; without even the implied warranty of
- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
- GNU General Public License for more details.
-
- You should have received a copy of the GNU Affero General Public License
- along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
-
- Authors:
-
- Vincent Barrier (vbarrier@kagilum.com)
- Manuarii Stein (manuarii.stein@icescrum.com)
--}%

<%@ page import="org.icescrum.core.domain.Task;org.icescrum.core.domain.Sprint;org.icescrum.core.domain.Story;" %>

<g:set var="inProduct" value="${sec.access(expression:'inProduct()',{true})}"/>
<g:set var="poOrSm" value="${sec.access([expression:'productOwner() or scrumMaster()'], {true})}"/>
<g:set var="scrumMaster" value="${sec.access([expression:'scrumMaster()'], {true})}"/>
<g:set var="nodropMessage" value="${g.message(code:'is.ui.sprintPlan.no.drop')}"/>
<g:set var="nodropMessageUrgent"
       value="${message(code: 'is.ui.sprintPlan.kanban.urgentTasks.limit', args:[limitValueUrgentTasks])}"/>

<is:kanban id="kanban-sprint-${sprint.id}"
           elemid="${sprint.id}"
           selectable="[filter:'div.postit-rect',
                        cancel:'span.postit-label, div.postit-story, a, span.mini-value, select, input',
                        selected:'jQuery.icescrum.dblclickSelectable(ui,300,function(obj){'+is.quickLook(params:'\'task.id=\'+jQuery.icescrum.postit.id(obj.selected)')+';})']"
           droppable='[selector:".kanban tbody tr",
                       hoverClass: "active",
                       rendered:(poOrSm && sprint.state != Sprint.STATE_DONE),
                       drop: remoteFunction(controller:"story",
                                           action:"plan",
                                           onSuccess:"ui.draggable.attr(\"remove\",\"true\"); jQuery.event.trigger(\"plan_story\",data.story)",
                                           params:"\"&product=${params.product}&id=\"+ui.draggable.attr(\"elemid\")+\"&position=\"+(jQuery(\"table.kanban tbody tr.row-story\").index(this) == -1 ? jQuery(\"table.kanban tbody tr.row-story\").index(this) + 2 : jQuery(\"table.kanban tbody tr.row-story\").index(this) + 1 )+\"&sprint.id=\"+jQuery(\"table.kanban\").attr(\"elemid\")"
                                           ),
                       accept: ".postit-row-story"]'>
%{-- Columns' headers --}%
    <is:kanbanHeader name="Story" key="story"/>
    <g:each in="${columns}" var="column">
        <is:kanbanHeader name="${message(code:column.name)}" key="${column.key}"/>
    </g:each>

%{-- Recurrent Tasks --}%
    <is:kanbanRow rendered="${displayRecurrentTasks}" class="row-recurrent-task" type="${Task.TYPE_RECURRENT}">

        <is:kanbanColumn>
            <g:message code="is.ui.sprintPlan.kanban.recurrentTasks"/>
            <g:if test="${inProduct && sprint.state <= Sprint.STATE_INPROGRESS}">
                <is:menu yoffset="3" class="dropmenu-action" id="menu-recurrent"
                         contentView="window/recurrentOrUrgentTask"
                         params="[sprint:sprint,previousSprintExist:previousSprintExist,type:'recurrent',id:id]"
                         rendered="${sprint.state != Sprint.STATE_DONE}"/>
            </g:if>
        </is:kanbanColumn>

        <g:each in="${columns}" var="column" status="i">
            <is:kanbanColumn key="${column.key}"
                             class="${(column.key != Task.STATE_WAIT && sprint.state != Sprint.STATE_INPROGRESS)?'no-drop wait':''}">

                <g:each in="${recurrentTasks?.sort{it.rank}?.findAll{ it.state == column.key} }" var="task">
                    <g:include view="/task/_postit.gsp" model="[id:id,task:task,user:user]"
                               params="[product:params.product]"/>
                </g:each>

            </is:kanbanColumn>
        </g:each>

    </is:kanbanRow>

%{-- Urgent Tasks --}%
    <is:kanbanRow rendered="${displayUrgentTasks}" class="row-urgent-task" type="${Task.TYPE_URGENT}">
        <is:kanbanColumn>
            <g:message code="is.ui.sprintPlan.kanban.urgentTasks"/>
            <g:if test="${inProduct && sprint.state <= Sprint.STATE_INPROGRESS}">
                <is:menu yoffset="3"
                         class="dropmenu-action"
                         id="menu-urgent"
                         contentView="window/recurrentOrUrgentTask"
                         params="[sprint:sprint,type:'urgent',id:id]"
                         rendered="${sprint.state != Sprint.STATE_DONE}"/>
            </g:if>
            <br/>
            <span>${(limitValueUrgentTasks) ? nodropMessageUrgent : ''}</span>
        </is:kanbanColumn>
        <g:each in="${columns}" var="column">
            <is:kanbanColumn key="${column.key}"
                             class="${(sprint.state != Sprint.STATE_INPROGRESS && column.key != Task.STATE_WAIT)?'no-drop wait':(urgentTasksLimited && limitValueUrgentTasks && column.key == Task.STATE_BUSY)?'no-drop':''}">
                <g:each in="${urgentTasks?.sort{it.rank}?.findAll{it.state == column.key}}" var="task">
                    <g:include view="/task/_postit.gsp" model="[id:id,task:task,user:user]"
                               params="[product:params.product]"/>
                </g:each>

            </is:kanbanColumn>
        </g:each>
    </is:kanbanRow>

%{-- Stories Rows --}%
    <is:kanbanRows in="${stories.sort{it.rank}}" var="story" class="row-story" elemid="id" type="story"
                   emptyRendering="true">
        <is:kanbanColumn elementId="column-story-${story.id}">
            <g:include view="/story/_postit.gsp"
                       model="[id:id,story:story,user:user,sprint:sprint,nextSprintExist:nextSprintExist,referrer:sprint.id]"
                       params="[product:params.product]"/>
        </is:kanbanColumn>

    %{-- Workflow Columns --}%
        <g:each in="${columns}" var="column">
            <is:kanbanColumn key="${column.key}"
                             class="${(column.key != Task.STATE_WAIT && sprint.state != Sprint.STATE_INPROGRESS)?'no-drop wait':''}">
                <g:each in="${story.tasks?.sort{it.rank}?.findAll{ (hideDoneState) ? (it.state == column.key && it.state != Task.STATE_DONE) : (it.state == column.key) }}"
                        var="task">
                    <g:include view="/task/_postit.gsp" model="[id:id,task:task,user:user]"
                               params="[product:params.product]"/>
                </g:each>
            </is:kanbanColumn>
        </g:each>
    </is:kanbanRows>

</is:kanban>

<jq:jquery>
    jQuery('div.postit-story').die('dblclick').live('dblclick',function(e){ var obj = jQuery(e.currentTarget);${is.quickLook(params: '\'story.id=\'+obj.attr(\"elemId\")')}});
    jQuery('#window-title-bar-${id} .content').html('${message(code: "is.ui." + id)} - ${message(code: "is.sprint")} ${sprint.orderNumber}  - ${is.bundle(bundle: 'sprintStates', value: sprint.state)} - [${g.formatDate(date: sprint.startDate, formatName: 'is.date.format.short')} -> ${g.formatDate(date: sprint.endDate, formatName: 'is.date.format.short')}]');

    <is:editable rendered="${sprint.state != Sprint.STATE_DONE}"
                 controller="story"
                 action='estimate'
                 on='div.postit-story span.mini-value.editable'
                 findId="jQuery(this).parents('.postit-story:first').attr('elemid')"
                 type="selectui"
                 before="jQuery(this).next().hide();"
                 cancel="jQuery(original).next().show();"
                 values="${suiteSelect}"
                 restrictOnNotAccess='teamMember() or scrumMaster()'
                 callback="jQuery(this).next().show();"
                 params="[product:params.product]"/>

    <is:editable rendered="${sprint.state != Sprint.STATE_DONE}"
                 on="div.postit-task span.mini-value.editable"
                 typed="[type:'numeric',allow:'?']"
                 onExit="submit"
                 action="estimateTask"
                 controller="task"
                 highlight="true"
                 before="jQuery(this).next().hide();"
                 cancel="jQuery(original).next().show();"
                 callback="jQuery(this).next().show();"
                 params="[product:params.product]"
                 findId="jQuery(this).parents('.postit-task:first').attr('elemid')"/>

    <is:sortable rendered="${sprint.state != Sprint.STATE_DONE}"
                 on="table.kanban td.kanban-col:not(.first)"
                 handle="p.postit-sortable"
                 cancel=".ui-selectable-disabled"
                 connectWith="td.kanban-cell"
                 items="div.postit-rect"
                 revert="true"
                 live="true"
                 over="if(jQuery(this).hasClass('no-drop wait')){ jQuery(ui.placeholder).html('${nodropMessage}'); }else{ jQuery(ui.placeholder).html(''); }"
                 update="var container = jQuery(this).find('.postit-rect'); if(container.index(ui.item) != -1 && ui.sender == undefined){${is.changeRank(controller:'task',action:'rank',params:'&product='+params.product+'')}}"
                 placeholder="postit-placeholder ui-corner-all"
                 receive="${remoteFunction(controller:'task',
                                   action:'state',
                                   onFailure:'jQuery(ui.sender).sortable(\'cancel\');',
                                   onSuccess:'jQuery.event.trigger(\'update_task\',data)',
                                   params:'\'id=\'+jQuery(this).attr(\'type\')+\'&product='+params.product+'&task.id=\'+ui.item.attr(\'elemid\')+\'&position=\'+(jQuery(this).find(\'.postit-rect\').index(ui.item)+1)+ (jQuery(this).parent().attr(\'type\') ? \'&task.type=\'+jQuery(this).parent().attr(\'type\') : \'\') + (jQuery(this).parent().attr(\'elemid\') ? \'&story.id=\'+jQuery(this).parent().attr(\'elemid\') : \'\')',
                                   before:'if(jQuery(this).hasClass(\'no-drop\')){jQuery(ui.sender).sortable(\'cancel\'); return;}')}"/>
</jq:jquery>
<is:shortcut key="space"
             callback="if(jQuery('#dialog').dialog('isOpen') == true){jQuery('#dialog').dialog('close'); return false;}jQuery.icescrum.dblclickSelectable(null,null,function(obj){${is.quickLook(params:'\'task.id=\'+jQuery.icescrum.postit.id(obj.selected)')}},true);"
             scope="${id}"/>
<is:shortcut key="ctrl+a" callback="jQuery('#window-content-${id} .ui-selectee').addClass('ui-selected');"/>

<is:onStream
        on="#kanban-sprint-${sprint.id}"
        events="[[object:'story',events:['update','estimate','unPlan','plan','done','unDone','inProgress','associated','dissociated']]]"
        template="sprintPlan"/>

<is:onStream
        on="#kanban-sprint-${sprint.id}"
        events="[[object:'task',events:['add','update','remove']]]"
        template="sprintPlan"/>

<is:onStream
        on="#kanban-sprint-${sprint.id}"
        events="[[object:'sprint',events:['close','activate']]]"/>